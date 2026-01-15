import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTask } from '../../services/deliveryService';
import './ManagerSellRequests.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ASSIGN_BASE = process.env.REACT_APP_ASSIGN_BASE || '';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const ManagerSellRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'PENDING' });
  const [typeSeg, setTypeSeg] = useState('ALL'); // ALL | BARRELS | EMPTY | PRODUCTION
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [assignDeliveryId, setAssignDeliveryId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [approvedRequests, setApprovedRequests] = useState(new Set());
  const [assignedRequests, setAssignedRequests] = useState(new Set());
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [maxRetries] = useState(3);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const url = `${API}/api/sell-requests/admin/all?limit=200`;
      const res = await fetch(url, { headers: authHeaders(), cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
      const rows = list.map(r => ({
        id: r._id,
        user: r.farmerId?.name || r.farmerId?.email || r.name || r.user?.name || '-',
        staff: r.assignedDeliveryStaffId?.name || r.assignedDeliveryStaffId?.email || '-',
        date: r.updatedAt || r.createdAt,
        status: r.status || '-'
      })).sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
      setHistoryRows(rows);
    } catch (e) {
      setError(e?.message || 'Failed to load history');
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const statusOptions = useMemo(() => ([
    'PENDING','REQUESTED','FIELD_ASSIGNED','COLLECTED','DELIVER_ASSIGNED','DELIVERED_TO_LAB','TESTED','ACCOUNT_CALCULATED','VERIFIED','INVOICED'
  ]), []);

  const load = async (force = false) => {
    // Prevent multiple concurrent requests
    if (loading && !force) {
      return;
    }

    // Simple rate limiting: prevent requests if last request was less than 10 seconds ago
    const now = Date.now();
    if (!force && now - lastRequestTime < 10000) {
      // Silently ignore rapid clicks without showing a message
      return;
    }

    setLoading(true); 
    setError('');
    setLastRequestTime(now);
    
    try {
      // Try multiple endpoints to get all types of user requests
      const endpoints = [
        '/api/sell-requests/admin/all',
        '/api/latex/admin/requests',
        '/api/barrel-requests/admin/all',
        // '/api/chemical-requests/admin/all', // removed (route not available)
        '/api/delivery/barrels/intake'
      ];
      
      let allRequests = [];
      let lastError = '';
      
      // Add small delays between requests to avoid rate limiting
      for (const endpoint of endpoints) {
        try {
          const url = `${API}${endpoint}`;
          const res = await fetch(url, { 
            headers: authHeaders(),
            cache: 'no-cache'
          });
          
          if (res.status === 429) {
            // Rate limited - wait and retry once
            const retryAfter = res.headers.get('Retry-After') || 5;
            console.warn(`Rate limited on ${endpoint}, waiting ${retryAfter}s...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the request
            const retryRes = await fetch(url, { 
              headers: authHeaders(),
              cache: 'no-cache'
            });
            
            if (!retryRes.ok) {
              lastError = `Failed to load from ${endpoint} (${retryRes.status})`;
              continue;
            }
            
            const data = await retryRes.json();
            const raw = data?.records || data?.items || data?.results || data?.data || (Array.isArray(data) ? data : []);
            
            if (raw && raw.length > 0) {
              const typedRequests = raw.map(r => ({
                ...r,
                _source: endpoint,
                _type: endpoint.includes('latex') ? 'LATEX' : 
                       endpoint.includes('delivery/barrels') ? 'SELL_BARRELS' :
                       endpoint.includes('barrel') ? 'BARREL' :
                       endpoint.includes('chemical') ? 'CHEMICAL' : 'SELL'
              }));
              allRequests = allRequests.concat(typedRequests);
            }
            continue;
          }
          
          if (!res.ok) { 
            lastError = `Failed to load from ${endpoint} (${res.status})`;
            continue;
          }
          
          const data = await res.json();
          const raw = data?.records || data?.items || data?.results || data?.data || (Array.isArray(data) ? data : []);
          
          if (raw && raw.length > 0) {
            // Add source type to each request
            const typedRequests = raw.map(r => ({
              ...r,
              _source: endpoint,
              _type: endpoint.includes('latex') ? 'LATEX' : 
                     endpoint.includes('delivery/barrels') ? 'SELL_BARRELS' :
                     endpoint.includes('barrel') ? 'BARREL' :
                     endpoint.includes('chemical') ? 'CHEMICAL' : 'SELL'
            }));
            allRequests = allRequests.concat(typedRequests);
          }
          
          // Add 200ms delay between requests to avoid rate limiting
          if (endpoint !== endpoints[endpoints.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (e) {
          console.log(`Error fetching ${endpoint}:`, e.message);
          continue;
        }
      }
      
      if (allRequests.length === 0) { 
        setError('No user requests found in any category');
        setRows([]);
        return;
      }
      
      // Sort by creation date (newest first)
      allRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.requestedAt || a.submittedAt || 0);
        const dateB = new Date(b.createdAt || b.requestedAt || b.submittedAt || 0);
        return dateB - dateA;
      });
      
      const normalized = allRequests.map(r => {
        const s = r.status ?? r.requestStatus ?? r.state ?? r.currentStatus;
        return {
          ...r,
          _statusUpper: typeof s === 'string' ? s.toUpperCase() : '',
          _createdAt: r.createdAt || r.requestedAt || r.submittedAt || r.created_on || r.date || r.timestamp,
          _type: r._type || r.type || r.requestType || r.category || 'USER REQUEST',
          _notes: r.notes || r.subject || r.description || r.remark || r.message || 
                  (r.barrelCount ? `Sell ${r.barrelCount} barrel(s)` : undefined) ||
                  (r.quantity ? `${r.quantity}kg latex` : undefined) ||
                  (r.chemicalName ? `Chemical: ${r.chemicalName}` : undefined),
          _farmer: r.name || r.contactName || r.farmerName || r.user?.name || r.userName || 
                   r.farmerId?.name || r.farmerId?.email || r.user?.email || r.email ||
                   r.requestedBy?.name || r.createdBy?.name || 'Unknown User',
        };
      });
      
      setRows(normalized);
      setRetryCount(0);
      setIsRetrying(false);
      
    } catch (e) {
      setError(`Failed to load user requests: ${e?.message || 'Network error'}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.status]);
  // No automatic polling - only manual refresh to prevent 429 errors

  // minimized: removed enrichment

  // assignField removed per request

  const openAssignDelivery = async (id) => {
    // Show delivery staff selection modal
    setAssignDeliveryId(id);
    setShowAssignModal(true);
    setError('');
    setInfo('');
    setStaffError('');
    setStaffLoading(true);
    try {
      // Try multiple endpoints to get delivery staff
      let deliveryStaff = [];
      
      // First try the user-management endpoint
      try {
        const res = await fetch(`${API}/api/user-management/staff?role=delivery_staff&status=active&limit=100`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data?.records) ? data.records : []);
          deliveryStaff = list.filter(u => (u.role || '').toLowerCase() === 'delivery_staff');
        }
      } catch (e) {
        console.log('User-management endpoint failed, trying shifts endpoint');
      }
      
      // If no results, try the shifts endpoint
      if (deliveryStaff.length === 0) {
        try {
          const res = await fetch(`${API}/api/shifts/staff`, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data?.staff) ? data.staff : (Array.isArray(data) ? data : []);
            deliveryStaff = list.filter(u => (u.role || '').toLowerCase() === 'delivery_staff');
          }
        } catch (e) {
          console.log('Shifts endpoint failed, trying fallback');
        }
      }
      
      // Fallback: try the old users endpoint
      if (deliveryStaff.length === 0) {
        try {
          const res = await fetch(`${API}/api/users`, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
            deliveryStaff = list.filter(u => (u.role || '').toLowerCase() === 'delivery_staff');
          }
        } catch (e) {
          console.log('All endpoints failed');
        }
      }
      
      setStaffList(deliveryStaff);
      if (deliveryStaff.length === 0) {
        setStaffError('No delivery staff found. Please ensure delivery staff are registered in the system.');
      }
    } catch (e) {
      setStaffError('Failed to load delivery staff');
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const confirmAssignDelivery = async () => {
    if (!selectedStaff) {
      setError('Please select a delivery staff member');
      return;
    }
    
    // Disable button after clicking
    setAssignedRequests(prev => new Set([...prev, assignDeliveryId]));
    
    try {
      const req = rows.find(r => r._id === assignDeliveryId) || {};
      
      // For SELL requests, assign on SellRequest; for SELL_BARRELS (delivery intakes), skip and directly create a task
      if (req._type === 'SELL') {
        const assignResponse = await fetch(`${API}/api/sell-requests/${assignDeliveryId}/assign-delivery`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ deliveryStaffId: selectedStaff })
        });
        if (!assignResponse.ok) {
          throw new Error(`Failed to assign delivery staff: ${assignResponse.status}`);
        }
      }
      
      // Normalize pickup address to a string (backend expects strings)
      const rawPickup = req.pickupAddress || req.address || req.capturedAddress || req.location;
      const pickupAddress = typeof rawPickup === 'string'
        ? rawPickup
        : (rawPickup && typeof rawPickup === 'object' && (rawPickup.label || rawPickup.name || rawPickup.address))
          ? (rawPickup.label || rawPickup.name || rawPickup.address)
          : 'Customer pickup location';

      // Then create a delivery task for the staff to see
      const payload = {
        title: req._type ? `${req._type} Pickup` : 'Pickup Task',
        customerUserId: req.createdBy || req.user?._id || req.userId || undefined,
        assignedTo: selectedStaff,
        pickupAddress,
        dropAddress: 'HFP Lab / Yard',
        scheduledAt: new Date().toISOString(),
        notes: req._notes || undefined,
        meta: {
          barrelCount: req.barrelCount ?? undefined,
          sellRequestId: req._type === 'SELL' ? req._id : undefined,
          intakeId: req._type === 'SELL_BARRELS' ? req._id : undefined
        }
      };
      
      await createTask(payload);
      setInfo('Assigned successfully');
      
      // Optimistic status update in table
      setRows(prev => prev.map(r => (
        r._id === assignDeliveryId ? { ...r, status: 'assigned', _statusUpper: 'ASSIGNED' } : r
      )));
      setAssignedRequests(prev => new Set([...prev, assignDeliveryId]));
      
    } catch (e) {
      setError('Failed to assign delivery staff: ' + (e?.message || 'Unknown error'));
      console.error('Assignment error:', e);
    }
    
    setShowAssignModal(false);
    setSelectedStaff('');
    setAssignDeliveryId(null);
    setError('');
  };


  const [verifyingId, setVerifyingId] = useState('');
  const [approvingId, setApprovingId] = useState('');
  const [info, setInfo] = useState('');
  const [cbEditId, setCbEditId] = useState('');
  const [cbEditValue, setCbEditValue] = useState('');
  const [bcEditId, setBcEditId] = useState('');
  const [bcEditValue, setBcEditValue] = useState('');

  const verify = async (id) => {
    if (verifyingId) return; // prevent duplicate clicks
    if (!window.confirm('Mark this request as verified?')) return;
    try {
      setVerifyingId(id);
      setError(''); setInfo('');
      // Use sell-requests API for verification
      const target = `${API}/api/sell-requests/${id}/verify`;
      const res = await fetch(target, { method: 'PUT', headers: authHeaders() });
      if (!res.ok) throw new Error(`Verify failed ${res.status} @ ${target}`);
      setInfo('Verified successfully.');
      // Optimistically mark status as approved in the table
      setRows(prev => prev.map(r => (
        r._id === id ? { ...r, status: 'approved', _statusUpper: 'APPROVED' } : r
      )));
      await load();
    } catch (e) {
      setError((e?.message || 'Verify failed').replace(/<[^>]*>/g, ''));
    } finally {
      setVerifyingId('');
    }
  };

  const approve = async (id) => {
    // Disable button after clicking
    setApprovedRequests(prev => new Set([...prev, id]));
    setInfo('Approved! ✅');
    setError('');
    try {
      const r = rows.find(x => x._id === id) || {};
      // If this row came from delivery barrel intake list, mark approved via generic update
      // The /approve endpoint requires pricePerBarrel and returns 400 without it.
      if (String(r._source || '').includes('/delivery/barrels/intake')) {
        const target = `${API}/api/delivery/barrels/intake/${id}`;
        await fetch(target, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status: 'approved' }) });
      }
      // Reflect approved status immediately in the table
      setRows(prev => prev.map(x => x._id === id ? { ...x, status: 'approved', _statusUpper: 'APPROVED' } : x));
    } catch (_) { /* non-blocking */ }
    // After approval, proceed to assign delivery
    openAssignDelivery(id);
  };

  const saveCompanyBarrel = async (id, value) => {
    const clean = String(value).trim();
    if (!clean) { setError('Company barrel cannot be empty'); return; }
    try {
      setError(''); setInfo('');
      const res = await fetch(`${API}/api/delivery/barrels/intake/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ companyBarrel: clean })
      });
      if (!res.ok) throw new Error(`Failed to set company barrel (${res.status})`);
      setInfo('Company barrel updated');
      await load(true);
      setCbEditId('');
      setCbEditValue('');
    } catch (e) {
      setError(e?.message || 'Failed to update company barrel');
    }
  };

  const onSaveBarrelCount = async (id, value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) { setError('Barrel count must be at least 1'); return; }
    try {
      setError(''); setInfo('');
      const res = await fetch(`${API}/api/delivery/barrels/intake/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ barrelCount: n })
      });
      if (!res.ok) throw new Error(`Failed to update barrel count (${res.status})`);
      setInfo('Barrel count updated');
      await load(true);
      setBcEditId('');
      setBcEditValue('');
    } catch (e) {
      setError(e?.message || 'Failed to update barrel count');
    }
  };

  const setUserAllowance = async (userId, currentLabel = '') => {
    if (!userId) { setError('Missing user id for allowance'); return; }
    const input = window.prompt(`Set user allowance (total barrels). ${currentLabel ? `Current: ${currentLabel}` : ''}`);
    if (input == null) return;
    const n = Number(input);
    if (!Number.isFinite(n) || n < 0) { setError('Allowance must be a number >= 0'); return; }
    try {
      setError(''); setInfo('');
      const res = await fetch(`${API}/api/delivery/barrels/allowance/${userId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ allowance: n })
      });
      if (!res.ok) throw new Error(`Failed to set allowance (${res.status})`);
      const data = await res.json();
      setInfo(`Allowance set. Total: ${data.allowance ?? n}, Remaining: ${Number.isFinite(data.remaining) ? data.remaining : 'Unlimited'}`);
      await load(true);
    } catch (e) {
      setError(e?.message || 'Failed to set allowance');
    }
  };

  const filtered = rows.filter(r => {
    // Type segmentation
    let typeOk = true;
    if (typeSeg === 'BARRELS') typeOk = r._type === 'BARREL';
    else if (typeSeg === 'EMPTY') typeOk = r._type === 'SELL_BARRELS';
    else if (typeSeg === 'PRODUCTION') typeOk = r._type === 'LATEX';

    // Status filter
    if (!filters.status) return typeOk;
    const wanted = filters.status.toUpperCase();
    if (wanted === 'PENDING') {
      return typeOk && (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED');
    }
    return typeOk && (r._statusUpper === wanted);
  });

  const safeDate = (d) => {
    if (!d) return '-';
    try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleString(); } catch { return '-'; }
  };

  const displayFarmer = (r) => {
    const toStr = (v) => {
      if (v == null) return '';
      if (typeof v === 'string' || typeof v === 'number') return String(v);
      if (typeof v === 'object') {
        // Try common fields
        const cand = v.name || v.fullName || v.email || v.phone || v.mobile || v._id;
        return cand ? String(cand) : '';
      }
      return '';
    };

    const name = toStr(r._farmer) || toStr(r.farmerName) || toStr(r.userName) || toStr(r.name) || toStr(r.customerName) || toStr(r.contactName) || toStr(r.farmer?.name) || toStr(r.requestedBy?.name) || toStr(r.createdBy?.name) || toStr(r.requester?.name) || toStr(r.ownerName) || toStr(r.profile?.name) || toStr(r.user?.fullName) || toStr(r.user?.name) || toStr(r.customer?.name);
    const phone = toStr(r.phone) || toStr(r.mobile) || toStr(r.contact) || toStr(r.user?.phone) || toStr(r.user?.mobile) || toStr(r.customer?.phone);
    const email = toStr(r.email) || toStr(r.user?.email) || toStr(r.customer?.email) || toStr(r.farmerId?.email);
    if (name && phone) return `${name} (${phone})`;
    if (name) return name;
    if (phone) return phone;
    if (email) return email;
    return '-';
  };

  // Calculate stats
  const stats = {
    total: filtered.length,
    pending: filtered.filter(r => r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED').length,
    approved: filtered.filter(r => r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)).length,
    assigned: filtered.filter(r => r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)).length
  };

  return (
    <div className="manager-sell-requests">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-top">
          <div className="header-title">
            <div className="title-icon">
              <i className="fas fa-clipboard-list" />
            </div>
            <h1>Sell Requests Management</h1>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => load(true)} 
              disabled={loading}
              className="btn btn-secondary"
            >
              <i className="fas fa-sync-alt" />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button 
              onClick={() => navigate('/manager/live-locations')}
              className="btn btn-secondary"
            >
              <i className="fas fa-map-marked-alt" />
              Live Map
            </button>
            <button 
              onClick={() => { setShowHistory(true); loadHistory(); }}
              className="btn btn-primary"
            >
              <i className="fas fa-history" />
              View History
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Requests</span>
            <div className="stat-icon total">
              <i className="fas fa-list" />
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pending</span>
            <div className="stat-icon pending">
              <i className="fas fa-clock" />
            </div>
          </div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Approved</span>
            <div className="stat-icon approved">
              <i className="fas fa-check-circle" />
            </div>
          </div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Assigned</span>
            <div className="stat-icon assigned">
              <i className="fas fa-truck" />
            </div>
          </div>
          <div className="stat-value">{stats.assigned}</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle" />
          {error}
        </div>
      )}

      {info && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle" />
          {info}
        </div>
      )}

      {/* Controls Panel */}
      <div className="controls-panel">
        <div className="controls-row">
          <div className="filter-group">
            <label className="filter-label">Status Filter:</label>
            <select 
              value={filters.status} 
              onChange={e => setFilters(s => ({ ...s, status: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="type-filters">
            {[
              { key: 'ALL', label: 'All Types', icon: 'fas fa-th' },
              { key: 'BARRELS', label: 'Barrels', icon: 'fas fa-drum' },
              { key: 'EMPTY', label: 'Empty Barrels', icon: 'fas fa-box-open' },
              { key: 'PRODUCTION', label: 'Production', icon: 'fas fa-industry' }
            ].map(seg => (
              <button
                key={seg.key}
                onClick={() => setTypeSeg(seg.key)}
                className={`type-filter-btn ${typeSeg === seg.key ? 'active' : ''}`}
              >
                <i className={seg.icon} />
                {seg.label}
              </button>
            ))}
          </div>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode('cards')}
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              title="Card View"
            >
              <i className="fas fa-th-large" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View"
            >
              <i className="fas fa-list" />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Display */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin" />
          </div>
          <div className="loading-text">Loading sell requests...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-inbox" />
          </div>
          <div className="empty-title">No sell requests found</div>
          {(filters.status || typeSeg !== 'ALL') && (
            <div className="empty-subtitle">Try adjusting your filters to see more results</div>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="requests-grid">
          {filtered.map((r) => {
            const toStr = (v) => {
              if (v == null) return '';
              if (typeof v === 'string' || typeof v === 'number') return String(v);
              if (typeof v === 'object') {
                const cand = v.name || v.fullName || v.email || v.phone || v.mobile || v._id;
                return cand ? String(cand) : '';
              }
              return '';
            };

            const name = toStr(r._farmer) || toStr(r.farmerName) || toStr(r.userName) || toStr(r.name) || toStr(r.customerName) || toStr(r.contactName) || toStr(r.farmer?.name) || toStr(r.requestedBy?.name) || toStr(r.createdBy?.name) || toStr(r.requester?.name) || toStr(r.ownerName) || toStr(r.profile?.name) || toStr(r.user?.fullName) || toStr(r.user?.name) || toStr(r.customer?.name);
            const phone = toStr(r.phone) || toStr(r.mobile) || toStr(r.contact) || toStr(r.user?.phone) || toStr(r.user?.mobile) || toStr(r.customer?.phone);
            const email = toStr(r.email) || toStr(r.user?.email) || toStr(r.customer?.email) || toStr(r.farmerId?.email);

            return (
              <div key={r._id} className="request-card">
                <div className="request-card-header">
                  <div className="request-id-section">
                    <span className="request-id-label">Request ID</span>
                    <span className="request-id-value">#{r._id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className="request-type-section">
                    <span className={`type-badge ${(r._type || '').toLowerCase().replace('_', '-')}`}>
                      <i className={
                        r._type === 'LATEX' ? 'fas fa-flask' :
                        r._type === 'BARREL' ? 'fas fa-drum' :
                        r._type === 'SELL_BARRELS' ? 'fas fa-box-open' :
                        r._type === 'CHEMICAL' ? 'fas fa-vial' : 'fas fa-shopping-cart'
                      } />
                      {r._type || 'SELL'}
                    </span>
                    <span className={`status-badge ${
                      (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'pending' :
                      (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'approved' :
                      (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'assigned' : 'default'
                    }`}>
                      <i className={
                        (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'fas fa-clock' :
                        (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'fas fa-check-circle' :
                        (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'fas fa-truck' : 'fas fa-info-circle'
                      } />
                      {assignedRequests.has(r._id) ? 'ASSIGNED' : (r.status || 'PENDING')}
                    </span>
                  </div>
                </div>

                <div className="request-customer-section">
                  <span className="customer-label">Customer Information</span>
                  <div className="customer-info">
                    <div className="customer-name-display">
                      <i className="fas fa-user-circle" />
                      {name || 'Unknown'}
                    </div>
                    {phone && (
                      <div className="customer-contact-info">
                        <i className="fas fa-phone" />
                        {phone}
                      </div>
                    )}
                    {!phone && email && (
                      <div className="customer-contact-info">
                        <i className="fas fa-envelope" />
                        {email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="request-details-section">
                  <div className="details-grid">
                    {r._type === 'SELL_BARRELS' && r.barrelCount && (
                      <div className="detail-item">
                        <span className="detail-item-label">Barrel Count</span>
                        <span className="detail-item-value">
                          <i className="fas fa-drum" />
                          {r.barrelCount}
                        </span>
                      </div>
                    )}
                    {r._type === 'SELL_BARRELS' && r.companyBarrel && (
                      <div className="detail-item">
                        <span className="detail-item-label">Company</span>
                        <span className="detail-item-value">
                          <i className="fas fa-building" />
                          {r.companyBarrel}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-item-label">Requested Date</span>
                      <span className="detail-item-value">
                        <i className="fas fa-calendar" />
                        {safeDate(r._createdAt || r.requestedAt || r.createdAt)}
                      </span>
                    </div>
                  </div>
                  {r._notes && (
                    <div className="request-notes">
                      <span className="notes-label">Notes</span>
                      <p className="notes-text">{r._notes}</p>
                    </div>
                  )}
                </div>

                <div className="request-footer">
                  <div className="request-actions">
                    {r._type === 'SELL' && (
                      <>
                        <button
                          onClick={() => openAssignDelivery(r._id)}
                          disabled={assignedRequests.has(r._id)}
                          className="action-btn action-btn-assign"
                        >
                          <i className="fas fa-truck" />
                          {assignedRequests.has(r._id) ? 'Assigned' : 'Assign'}
                        </button>
                        <button
                          disabled={verifyingId === r._id}
                          onClick={() => verify(r._id)}
                          className="action-btn action-btn-verify"
                        >
                          <i className="fas fa-check-circle" />
                          {verifyingId === r._id ? 'Verifying...' : 'Verify'}
                        </button>
                      </>
                    )}
                    {r._type === 'SELL_BARRELS' && (
                      <button
                        onClick={() => approve(r._id)}
                        disabled={approvedRequests.has(r._id)}
                        className="action-btn action-btn-approve"
                      >
                        <i className="fas fa-thumbs-up" />
                        {approvedRequests.has(r._id) ? 'Approved' : 'Approve'}
                      </button>
                    )}
                    {r._type !== 'SELL' && r._type !== 'SELL_BARRELS' && (
                      <button
                        onClick={() => alert(`View ${r._type} request details`)}
                        className="action-btn action-btn-details"
                      >
                        <i className="fas fa-info-circle" />
                        Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Details</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const toStr = (v) => {
                  if (v == null) return '';
                  if (typeof v === 'string' || typeof v === 'number') return String(v);
                  if (typeof v === 'object') {
                    const cand = v.name || v.fullName || v.email || v.phone || v.mobile || v._id;
                    return cand ? String(cand) : '';
                  }
                  return '';
                };

                const name = toStr(r._farmer) || toStr(r.farmerName) || toStr(r.userName) || toStr(r.name) || toStr(r.customerName) || toStr(r.contactName) || toStr(r.farmer?.name) || toStr(r.requestedBy?.name) || toStr(r.createdBy?.name) || toStr(r.requester?.name) || toStr(r.ownerName) || toStr(r.profile?.name) || toStr(r.user?.fullName) || toStr(r.user?.name) || toStr(r.customer?.name);
                const phone = toStr(r.phone) || toStr(r.mobile) || toStr(r.contact) || toStr(r.user?.phone) || toStr(r.user?.mobile) || toStr(r.customer?.phone);
                const email = toStr(r.email) || toStr(r.user?.email) || toStr(r.customer?.email) || toStr(r.farmerId?.email);

                return (
                  <tr key={r._id}>
                    <td>
                      <span className="cell-id">#{r._id?.slice(-8) || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="cell-customer">
                        <span className="customer-name">{name || 'Unknown'}</span>
                        {phone && <span className="customer-contact"><i className="fas fa-phone" /> {phone}</span>}
                        {!phone && email && <span className="customer-contact"><i className="fas fa-envelope" /> {email}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${(r._type || '').toLowerCase().replace('_', '-')}`}>
                        <i className={
                          r._type === 'LATEX' ? 'fas fa-flask' :
                          r._type === 'BARREL' ? 'fas fa-drum' :
                          r._type === 'SELL_BARRELS' ? 'fas fa-box-open' :
                          r._type === 'CHEMICAL' ? 'fas fa-vial' : 'fas fa-shopping-cart'
                        } />
                        {r._type || 'SELL'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'pending' :
                        (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'approved' :
                        (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'assigned' : 'default'
                      }`}>
                        <i className={
                          (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'fas fa-clock' :
                          (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'fas fa-check-circle' :
                          (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'fas fa-truck' : 'fas fa-info-circle'
                        } />
                        {assignedRequests.has(r._id) ? 'ASSIGNED' : (r.status || 'PENDING')}
                      </span>
                    </td>
                    <td>
                      <div className="cell-details">
                        {r._type === 'SELL_BARRELS' && (
                          <>
                            {r.barrelCount && (
                              <div className="detail-row">
                                <i className="fas fa-drum" />
                                <span className="detail-label">Barrels:</span>
                                <span className="detail-value">{r.barrelCount}</span>
                              </div>
                            )}
                            {r.companyBarrel && (
                              <div className="detail-row">
                                <i className="fas fa-building" />
                                <span className="detail-label">Company:</span>
                                <span className="detail-value">{r.companyBarrel}</span>
                              </div>
                            )}
                          </>
                        )}
                        {r._notes && (
                          <div className="detail-row">
                            <i className="fas fa-sticky-note" />
                            <span className="detail-value">{r._notes.length > 40 ? r._notes.substring(0, 40) + '...' : r._notes}</span>
                          </div>
                        )}
                        {!r._notes && !r.barrelCount && <span className="detail-value">-</span>}
                      </div>
                    </td>
                    <td>
                      <span className="cell-date">{safeDate(r._createdAt || r.requestedAt || r.createdAt)}</span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        {r._type === 'SELL' && (
                          <>
                            <button
                              onClick={() => openAssignDelivery(r._id)}
                              disabled={assignedRequests.has(r._id)}
                              className="action-btn action-btn-assign"
                            >
                              <i className="fas fa-truck" />
                              {assignedRequests.has(r._id) ? 'Assigned' : 'Assign'}
                            </button>
                            <button
                              disabled={verifyingId === r._id}
                              onClick={() => verify(r._id)}
                              className="action-btn action-btn-verify"
                            >
                              <i className="fas fa-check-circle" />
                              {verifyingId === r._id ? 'Verifying...' : 'Verify'}
                            </button>
                          </>
                        )}
                        {r._type === 'SELL_BARRELS' && (
                          <button
                            onClick={() => approve(r._id)}
                            disabled={approvedRequests.has(r._id)}
                            className="action-btn action-btn-approve"
                          >
                            <i className="fas fa-thumbs-up" />
                            {approvedRequests.has(r._id) ? 'Approved' : 'Approve'}
                          </button>
                        )}
                        {r._type !== 'SELL' && r._type !== 'SELL_BARRELS' && (
                          <button
                            onClick={() => alert(`View ${r._type} request details`)}
                            className="action-btn action-btn-details"
                          >
                            <i className="fas fa-info-circle" />
                            Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-icon">
                  <i className="fas fa-history" />
                </div>
                <h3>Sell Requests History</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={loadHistory}
                  disabled={historyLoading}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  <i className="fas fa-sync-alt" />
                  {historyLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Delivery Staff</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map(r => (
                    <tr key={r.id}>
                      <td>{r.user}</td>
                      <td>{r.staff}</td>
                      <td>{r.date ? new Date(r.date).toLocaleString() : '-'}</td>
                      <td>
                        <span className={`status-badge ${
                          r.status?.toLowerCase() === 'pending' ? 'pending' :
                          r.status?.toLowerCase() === 'approved' ? 'approved' :
                          r.status?.toLowerCase() === 'assigned' ? 'assigned' : 'default'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historyRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-table-message">
                        {historyLoading ? 'Loading...' : 'No history found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-icon">
                  <i className="fas fa-user-plus" />
                </div>
                <h3>Assign Delivery Staff</h3>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStaff('');
                  setAssignDeliveryId(null);
                }}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Select a delivery staff member to assign this request:</p>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="modal-select"
              >
                <option value="">Choose delivery staff...</option>
                {staffLoading && <option value="" disabled>Loading...</option>}
                {!staffLoading && staffList.map(s => (
                  <option key={s._id} value={s._id}>{s.name || s.email}</option>
                ))}
                {!staffLoading && !staffList.length && <option value="" disabled>No delivery staff found</option>}
              </select>
              {staffError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle" />
                  {staffError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStaff('');
                    setAssignDeliveryId(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAssignDelivery}
                  disabled={!selectedStaff}
                  className="btn btn-primary"
                >
                  <i className="fas fa-check" />
                  Assign Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSellRequests;
