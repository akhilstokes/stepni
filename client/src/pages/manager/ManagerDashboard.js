import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './ManagerDashboard.css';



const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    attendance: {
      today: { present: 0, absent: 0, late: 0, unverified: 0 },
      week: { present: 0, absences: 0 },
      stats: { totalRecords: 0, verifiedRecords: 0, unverifiedRecords: 0 }
    },
    bills: {
      pending: 0,
      totalAmount: 0,
      byCategory: []
    },
    rates: {
      pending: 0,
      latest: []
    },
    stock: {
      summary: null,
      alerts: []
    }
  });
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load data with staggered requests to avoid rate limiting
      const attendanceRes = await axios.get(`${base}/api/workers/attendance/summary/today`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const attendanceStatsRes = await axios.get(`${base}/api/workers/attendance/stats`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const billsRes = await axios.get(`${base}/api/bills/manager/pending`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const ratesRes = await axios.get(`${base}/api/daily-rates/admin/pending`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const stockRes = await axios.get(`${base}/api/stock/summary`, config);

      setDashboardData({
        attendance: {
          today: attendanceRes.data || { present: 0, absent: 0, late: 0 },
          week: { present: 0, absences: 0 }, // Will be loaded separately
          stats: attendanceStatsRes.data || { totalRecords: 0, verifiedRecords: 0, unverifiedRecords: 0 }
        },
        bills: {
          pending: billsRes.data?.total || 0,
          totalAmount: billsRes.data?.bills?.reduce((sum, bill) => sum + bill.requestedAmount, 0) || 0,
          byCategory: billsRes.data?.stats || []
        },
        rates: {
          pending: ratesRes.data?.total || 0,
          latest: ratesRes.data?.rates || []
        },
        stock: {
          summary: stockRes.data || null,
          alerts: [] // Will be implemented based on stock thresholds
        }
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [base, config]);

  useEffect(() => {
    loadDashboardData();
    // Reload dashboard data every 5 minutes to avoid rate limiting
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        // Check if user is authenticated before making the request
        if (!token) {
          console.log('No authentication token found, skipping notifications');
          setNotifs([]);
          setUnread(0);
          return;
        }

        const res = await fetch(`${base}/api/notifications?limit=10`, { headers: config });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
          setNotifs(list);
          setUnread(Number(data?.unread || (list.filter(n=>!n.read).length)));
        } else if (res.status === 401) {
          // Unauthorized - user needs to login
          console.log('User not authenticated, redirecting to login');
          navigate('/login');
          return;
        } else if (res.status === 429) {
          // Rate limited - don't spam console, just skip this update
          console.log('Notifications rate limited, will retry later');
          return;
        } else {
          setNotifs([]);
          setUnread(0);
        }
      } catch (error) {
        // Only log non-rate-limit errors
        if (!error.message?.includes('429')) {
          console.error('Error loading notifications:', error);
        }
        setNotifs([]);
        setUnread(0);
      }
    };
    loadNotifs();
    // Reduced frequency to avoid rate limiting (every 2 minutes instead of 30 seconds)
    const id = setInterval(loadNotifs, 120000);
    return () => clearInterval(id);
  }, [base, config, token, navigate]);

  const markRead = async (id) => {
    try {
      const res = await fetch(`${base}/api/notifications/${id}/read`, { method: 'PATCH', headers: config });
      if (res.ok) {
        setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnread(u => Math.max(0, u - 1));
      }
    } catch {}
  };


  // Format notification metadata in a user-friendly way
  const formatMetadata = (meta) => {
    if (!meta) return null;
    
    const friendlyLabels = {
      sampleId: 'Sample ID',
      customerName: 'Customer',
      calculatedAmount: 'Amount',
      marketRate: 'Market Rate',
      companyRate: 'Company Rate',
      quantity: 'Quantity',
      drcPercentage: 'DRC %',
      requestId: 'Request ID',
      barrelCount: 'Barrel Count',
      customer: 'Customer',
      receivedAt: 'Received At',
      workerId: 'Worker ID',
      billId: 'Bill ID'
    };

    return Object.entries(meta)
      .filter(([k, v]) => v !== undefined && v !== null && v !== '')
      .map(([key, value]) => ({
        label: friendlyLabels[key] || key.replace(/([A-Z])/g, ' $1').trim(),
        value: String(value)
      }));
  };

  // Get notification icon based on title/type
  const getNotificationIcon = (title) => {
    if (!title) return '📋';
    const lower = title.toLowerCase();
    if (lower.includes('billing') || lower.includes('latex')) return '💰';
    if (lower.includes('drc') || lower.includes('test')) return '🧪';
    if (lower.includes('attendance')) return '👥';
    if (lower.includes('leave')) return '📅';
    if (lower.includes('bill') || lower.includes('payment')) return '💳';
    if (lower.includes('stock') || lower.includes('inventory')) return '📦';
    if (lower.includes('rate')) return '💹';
    if (lower.includes('delivery')) return '🚚';
    return '📋';
  };

  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <h2>Manager Dashboard</h2>
        <div>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Manager Dashboard</h2>
        <button onClick={loadDashboardData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'tomato', marginBottom: 16, padding: 12, background: '#fee', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 16, 
        marginBottom: 32 
      }}>
        {/* Attendance Card */}
        <div className="dash-card">
          <h4 style={{ marginTop: 0, color: '#2563eb' }}>Today's Attendance</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
                {dashboardData.attendance.today.present}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Present</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
                {dashboardData.attendance.today.absent}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Absent</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#d97706' }}>
                {dashboardData.attendance.today.late}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Late</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#7c3aed' }}>
                {dashboardData.attendance.stats.unverifiedRecords}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Unverified</div>
            </div>
          </div>
        </div>

        {/* Bill Requests Card */}
        <div className="dash-card">
          <h4 style={{ marginTop: 0, color: '#2563eb' }}>Pending Bill Requests</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
                {dashboardData.bills.pending}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Requests</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
                ₹{dashboardData.bills.totalAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Total Amount</div>
            </div>
          </div>
          {dashboardData.bills.byCategory.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>By Category:</div>
              {dashboardData.bills.byCategory.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{cat._id}:</span>
                  <span>{cat.count} (₹{cat.totalAmount.toLocaleString()})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rate Updates Card */}
        <div className="dash-card">
          <h4 style={{ marginTop: 0, color: '#2563eb' }}>Rate Updates</h4>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
              {dashboardData.rates.pending}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Pending Admin Approval</div>
          </div>
          {dashboardData.rates.latest.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Recent Submissions:</div>
              {dashboardData.rates.latest.slice(0, 3).map((rate, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{rate.category}:</span>
                  <span>₹{rate.inr} / ${rate.usd}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Overview Card */}
        <div className="dash-card">
          <h4 style={{ marginTop: 0, color: '#2563eb' }}>Stock Overview</h4>
          {dashboardData.stock.summary ? (
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
                {dashboardData.stock.summary.rubberBandUnits || 0}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Rubber Band Units</div>
              {dashboardData.stock.summary.latexLiters !== undefined && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}>
                    {dashboardData.stock.summary.latexLiters}L
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Latex Stock</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#6b7280' }}>No stock data available</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 32 
      }}>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.href = '/manager/attendance'}
          style={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Verify Attendance</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>GPS-based verification</div>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={() => window.location.href = '/manager/bills'}
          style={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Review Bills</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{dashboardData.bills.pending} pending</div>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={() => window.location.href = '/manager/rates'}
          style={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Update Rates</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Submit for admin approval</div>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={() => window.location.href = '/manager/shifts'}
          style={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Manage Shifts</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Create schedules</div>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={() => window.location.href = '/manager/stock'}
          style={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Monitor Stock</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>View-only access</div>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={() => window.location.href = '/manager/reports'}
          style={{ padding: 16, textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Generate Reports</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>For admin review</div>
        </button>
      </div>

      {/* Notifications Section */}
      <div className="dash-card" style={{ padding: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h4 style={{ marginTop: 0 }}>Recent Notifications</h4>
          <span style={{ color:'#64748b', fontSize:12 }}>Unread: {unread}</span>
        </div>
        {notifs.length === 0 ? (
          <div style={{ color:'#94a3b8' }}>No notifications</div>
        ) : (
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:8 }}>
            {notifs.slice(0, 5).map(n => (
              <li key={n._id} style={{
                border:'1px solid #e2e8f0', borderRadius:8, padding:12, background: n.read ? '#fff' : '#f8fafc'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                  <div>
                    <div style={{ fontWeight:600 }}>{n.title || 'Update'}</div>
                    <div style={{ color:'#475569', fontSize:14 }}>{n.message}</div>
                    {n.meta && (
                      <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap', color:'#64748b', fontSize:12 }}>
                        {Object.entries(n.meta).map(([k,v]) => (
                          <span key={k}><strong>{k}:</strong> {String(v)}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ color:'#94a3b8', fontSize:12, marginTop:6 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                    {n.link && (
                      <button className="btn" onClick={() => {

                        if (n.link.startsWith('http')) {
                          window.open(n.link, '_blank');
                        } else {
                          navigate(n.link);
                        }
                      }}
                    >
                      Open
                    </button>
                  )}
                  {!n.read && (
                    <button 
                      className="notif-action-btn notif-mark-btn" 
                      onClick={() => markRead(n._id)}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
