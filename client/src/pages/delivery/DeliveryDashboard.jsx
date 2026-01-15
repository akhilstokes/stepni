import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyTasks, updateStatus } from '../../services/deliveryService';
import './DeliveryDashboard.css';

const StatusBadge = ({ s }) => (
  <span className={`badge status-${String(s).replace(/_/g,'-')}`}>{s}</span>
);

const DeliveryDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftInfo, setShiftInfo] = useState(null);
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 
      Authorization: `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    } : { 
      'Content-Type': 'application/json' 
    };
  };

  const load = async () => {
    try { 
      // Load both delivery tasks and assigned sell requests
      const [deliveryTasks, assignedRequests] = await Promise.all([
        loadDeliveryTasks(),
        loadAssignedSellRequests()
      ]);
      
      // Combine both types of tasks
      const allTasks = [...deliveryTasks, ...assignedRequests];
      setTasks(allTasks);
      
      // Load shift info separately
      await loadShiftInfo();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setTasks([]);
    } finally { 
      setLoading(false); 
    }
  };

  const loadDeliveryTasks = async () => {
    try {
      const tasks = await listMyTasks();
      return tasks;
    } catch (error) {
      console.error('Error loading delivery tasks:', error);
      return [];
    }
  };

  const loadAssignedSellRequests = async () => {
    try {
      const response = await fetch(`${API}/api/sell-requests/delivery/my-assigned`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const assigned = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
        return assigned.map(r => ({
          _id: `sr_${r._id}`,
          title: r._type ? `${r._type} Pickup` : (r.barrelCount != null ? `Sell Request Pickup (${r.barrelCount})` : 'Sell Request Pickup'),
          status: r.status || 'DELIVER_ASSIGNED',
          scheduledAt: r.assignedAt || r.updatedAt || r.createdAt,
          createdAt: r.createdAt,
          customerUserId: r.farmerId,
          pickupAddress: r.capturedAddress || 'Customer pickup location',
          dropAddress: 'HFP Lab / Yard',
          meta: {
            barrelCount: r.barrelCount,
            sellRequestId: r._id
          },
          isSellRequest: true
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading assigned sell requests:', error);
      return [];
    }
  };

  const loadShiftInfo = async () => {
    try {
      const response = await fetch(`${API}/api/delivery/shift-schedule`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setShiftInfo(data.myAssignment);
      }
    } catch (error) {
      console.error('Error loading shift info:', error);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const quickAction = async (t, next) => {
    await updateStatus(t._id, { status: next });
    await load();
  };

  const deliverToLab = async (t) => {
    // follow allowed transitions to avoid 400s
    const order = ['pickup_scheduled','enroute_pickup','picked_up','enroute_drop','delivered'];
    const idx = Math.max(order.indexOf(t.status), 0);
    for (let i = idx + 1; i < order.length; i++) {
      await updateStatus(t._id, { status: order[i] });
    }
    const sellReqId = t?.meta?.sellRequestId;
    if (sellReqId) {
      try { 
        await fetch(`${API}/api/sell-requests/${sellReqId}/deliver-to-lab`, { 
          method: 'PUT', 
          headers: authHeaders() 
        }); 
      } catch {}
    }
    // Notify lab staff instead of navigating to lab pages
    try {
      const customer = t?.customerUserId?.name || t?.customerUserId?.email || '';
      const count = t?.meta?.barrelCount ?? '';
      const sampleId = sellReqId || t?._id;
      await fetch(`${API}/api/notifications/staff-trip-event`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: 'Delivery to Lab',
          message: `Sample ${String(sampleId)} delivered by delivery staff`,
          link: '/lab/check-in',
          meta: {
            sampleId: String(sampleId),
            sellRequestId: sellReqId || undefined,
            intakeId: !sellReqId ? String(t?._id) : undefined,
            barrelCount: String(count),
            customer,
            barrels: Array.isArray(t?.meta?.barrels) ? t.meta.barrels.map(id => ({ barrelId: id })) : undefined
          },
          targetRole: 'lab'
        })
      });
    } catch (_) {}
    await load();
    alert('Lab has been notified.');
  };

  const setBarrelIds = async (t) => {
    const existing = Array.isArray(t?.meta?.barrels) ? t.meta.barrels.join(',') : '';
    const input = window.prompt('Enter Barrel IDs (comma separated):', existing);
    if (input == null) return;
    const ids = input.split(',').map(s=>s.trim()).filter(Boolean);
    try { 
      await updateStatus(t._id, { meta: { barrels: ids } }); 
      await load(); 
    } catch (e) { 
      alert(e?.message || 'Failed to save barrel IDs'); 
    }
  };

  const handleSellRequestAction = async (t, action) => {
    try {
      if (action === 'start_pickup') {
        // Update sell request status to indicate pickup started
        const response = await fetch(`${API}/api/sell-requests/${t.meta.sellRequestId}/status`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'PICKUP_STARTED' })
        });
        if (response.ok) {
          await load(); // Reload to show updated status
        }
      } else if (action === 'mark_picked') {
        // Mark as collected
        const response = await fetch(`${API}/api/sell-requests/${t.meta.sellRequestId}/collected`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ 
            totalVolumeKg: t.meta.barrelCount || 0,
            notes: 'Collected by delivery staff'
          })
        });
        if (response.ok) {
          await load(); // Reload to show updated status
        }
      } else if (action === 'deliver_to_lab') {
        // Mark as delivered to lab
        const response = await fetch(`${API}/api/sell-requests/${t.meta.sellRequestId}/delivered-to-lab`, {
          method: 'PUT',
          headers: authHeaders()
        });
        if (response.ok) {
          await load(); // Reload to show updated status
        }
      }
    } catch (error) {
      console.error('Error handling sell request action:', error);
      alert('Failed to update sell request status');
    }
  };

  return (
    <div>
      <h2>Delivery Dashboard</h2>
      
      {/* Shift Information */}
      {shiftInfo && (
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>
            <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
            Today's Shift: {shiftInfo.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Start Time</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{shiftInfo.startTime}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>End Time</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{shiftInfo.endTime}</div>
            </div>
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Duration: {shiftInfo.duration} | Grace Period: {shiftInfo.gracePeriod} minutes
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : tasks.length === 0 ? (
        <div className="no-data">No assigned tasks</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Title</th>
                <th>Customer</th>
                <th>Barrels</th>
                <th>Pickup</th>
                <th>Drop</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id} style={{ backgroundColor: t.isSellRequest ? '#f8f9fa' : 'inherit' }}>
                  <td>{t.scheduledAt ? new Date(t.scheduledAt).toLocaleString('en-IN') : '-'}</td>
                  <td>
                    {t.title}
                    {t.isSellRequest && (
                      <span style={{ 
                        marginLeft: '8px', 
                        padding: '2px 6px', 
                        backgroundColor: '#e3f2fd', 
                        color: '#1976d2', 
                        borderRadius: '4px', 
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        SELL REQUEST
                      </span>
                    )}
                  </td>
                  <td>{t.customerUserId?.name || t.customerUserId?.email || '-'}</td>
                  <td>{t?.meta?.barrelCount ?? '-'}</td>
                  <td>{t.pickupAddress}</td>
                  <td>{t.dropAddress}</td>
                  <td><StatusBadge s={t.status} /></td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {t.isSellRequest ? (
                      // Actions for sell request assignments
                      <>
                        <button className="btn" onClick={()=>handleSellRequestAction(t, 'start_pickup')}>Start Pickup</button>
                        <button className="btn-secondary" onClick={()=>handleSellRequestAction(t, 'mark_picked')}>Mark Picked</button>
                        <button className="btn-secondary" onClick={()=>handleSellRequestAction(t, 'deliver_to_lab')}>Deliver to Lab</button>
                        <button className="btn-secondary" onClick={()=>deliverToLab(t)}>Notify Lab</button>
                      </>
                    ) : (
                      // Actions for regular delivery tasks
                      <>
                        {t.status === 'pickup_scheduled' && (
                          <button className="btn-secondary" onClick={()=>quickAction(t,'enroute_pickup')}>Start Pickup</button>
                        )}
                        {t.status === 'enroute_pickup' && (
                          <button className="btn" onClick={()=>quickAction(t,'picked_up')}>Mark Picked</button>
                        )}
                        {t.status === 'picked_up' && (
                          <button className="btn-secondary" onClick={()=>quickAction(t,'enroute_drop')}>Start Drop</button>
                        )}
                        {t.status === 'enroute_drop' && (
                          <button className="btn" onClick={()=>quickAction(t,'delivered')}>Mark Delivered</button>
                        )}
                        {t.status !== 'delivered' && (
                          <button className="btn-secondary" onClick={()=>deliverToLab(t)}>Delivered to Lab</button>
                        )}
                        <button className="btn-secondary" onClick={()=>setBarrelIds(t)}>Set Barrel IDs</button>
                        <button className="btn-secondary" onClick={()=>deliverToLab(t)}>Notify Lab</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;