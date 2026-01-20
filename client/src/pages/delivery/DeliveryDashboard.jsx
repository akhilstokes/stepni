import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyTasks, updateStatus } from '../../services/deliveryService';
import './DeliveryDashboard.css';

const StatusBadge = ({ s }) => (
  <span className={`badge status-${String(s).replace(/_/g,'-')}`}>{s}</span>
);

const DeliveryDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [barrelDeliveries, setBarrelDeliveries] = useState([]);
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
      // Load delivery tasks, assigned sell requests, and barrel deliveries
      const [deliveryTasks, assignedRequests, barrelDeliveryTasks] = await Promise.all([
        loadDeliveryTasks(),
        loadAssignedSellRequests(),
        loadBarrelDeliveries()
      ]);
      
      // Combine delivery tasks and sell requests
      const allTasks = [...deliveryTasks, ...assignedRequests];
      setTasks(allTasks);
      setBarrelDeliveries(barrelDeliveryTasks);
      
      // Load shift info separately
      await loadShiftInfo();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setTasks([]);
      setBarrelDeliveries([]);
    } finally { 
      setLoading(false); 
    }
  };

  const loadBarrelDeliveries = async () => {
    try {
      const response = await fetch(`${API}/api/barrels/my-delivery-tasks`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        return data.tasks || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading barrel deliveries:', error);
      return [];
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
        // Filter out completed intakes - check for DELIVERED_TO_LAB status
        return assigned
          .filter(r => {
            const status = (r.status || '').toUpperCase();
            // Exclude if already delivered to lab or intake completed
            return status !== 'DELIVERED_TO_LAB' && status !== 'INTAKE_COMPLETED';
          })
          .map(r => ({
            _id: `sr_${r._id}`,
            title: r._type ? `${r._type} Pickup` : (r.barrelCount != null ? `Sell Request Pickup (${r.barrelCount})` : 'Sell Request Pickup'),
            status: r.status || 'DELIVER_ASSIGNED',
            scheduledAt: r.assignedAt || r.updatedAt || r.createdAt,
            createdAt: r.createdAt,
            customerUserId: r.farmerId,
            pickupAddress: r.notes || r.capturedAddress || r.farmerId?.location || 'Customer pickup location',
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

  // Auto-refresh when page becomes visible (user returns from barrel intake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard became visible, refreshing data...');
        load();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      console.log('Window gained focus, refreshing data...');
      load();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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

      {/* Barrel Deliveries Section */}
      {barrelDeliveries.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-truck" style={{ color: '#3b82f6' }}></i>
              Barrel Deliveries
              <span style={{ 
                background: '#3b82f6', 
                color: 'white', 
                padding: '2px 10px', 
                borderRadius: '12px', 
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {barrelDeliveries.filter(d => d.deliveryStatus !== 'delivered').length}
              </span>
            </h3>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/delivery/barrel-deliveries')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              View All <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '15px' 
          }}>
            {barrelDeliveries.slice(0, 3).map(delivery => (
              <div key={delivery._id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    #{delivery._id.slice(-6)}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: delivery.deliveryStatus === 'delivered' ? '#d1fae5' : '#fef3c7',
                    color: delivery.deliveryStatus === 'delivered' ? '#065f46' : '#92400e'
                  }}>
                    {delivery.deliveryStatus === 'delivered' ? 'Delivered' : 'Pending'}
                  </span>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    {delivery.user?.name || 'Unknown Customer'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {delivery.quantity} barrel(s)
                  </div>
                </div>
                
                {delivery.assignedBarrels && delivery.assignedBarrels.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    {delivery.assignedBarrels.slice(0, 2).map(barrelId => (
                      <span key={barrelId} style={{
                        padding: '2px 6px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        fontFamily: 'monospace'
                      }}>
                        {barrelId}
                      </span>
                    ))}
                    {delivery.assignedBarrels.length > 2 && (
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        +{delivery.assignedBarrels.length - 2} more
                      </span>
                    )}
                  </div>
                )}
                
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>
                  {delivery.deliveryLocation || 'Location not specified'}
                </div>
                
                {delivery.deliveryDate && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    <i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>
                    {new Date(delivery.deliveryDate).toLocaleDateString('en-GB')}
                  </div>
                )}
                
                <button 
                  className="btn"
                  onClick={() => {
                    const customer = delivery.user?.name || 'Unknown Customer';
                    const phone = delivery.user?.phoneNumber || '';
                    const count = delivery.quantity || '1';
                    const taskId = delivery._id || '';
                    const requestId = delivery.requestId || '';
                    
                    const qs = new URLSearchParams();
                    qs.set('customerName', String(customer));
                    qs.set('customerPhone', String(phone));
                    qs.set('barrelCount', String(count));
                    qs.set('taskId', String(taskId));
                    if (requestId) qs.set('requestId', String(requestId));
                    
                    navigate(`/delivery/barrel-intake?${qs.toString()}`);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    fontSize: '13px'
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
          
          {barrelDeliveries.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/delivery/barrel-deliveries')}
              >
                View All {barrelDeliveries.length} Deliveries
              </button>
            </div>
          )}
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
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                      {t.customerUserId?.name || t.customerUserId?.email || '-'}
                    </div>
                    {t.customerUserId?.phoneNumber && (
                      <a 
                        href={`tel:${t.customerUserId.phoneNumber}`}
                        style={{
                          fontSize: '11px',
                          color: '#10b981',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-phone"></i>
                        {t.customerUserId.phoneNumber}
                      </a>
                    )}
                  </td>
                  <td>{t?.meta?.barrelCount ?? '-'}</td>
                  <td style={{ maxWidth: '250px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                      {t.pickupAddress}
                    </div>
                    {t.pickupLocation && t.pickupLocation.coordinates && t.pickupLocation.coordinates.length === 2 && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${t.pickupLocation.coordinates[1]},${t.pickupLocation.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '11px',
                          color: '#3b82f6',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-map-marker-alt"></i>
                        View on Map
                        {t.meta?.locationAccuracy && (
                          <span style={{ color: '#64748b', marginLeft: '4px' }}>
                            (±{Math.round(t.meta.locationAccuracy)}m)
                          </span>
                        )}
                      </a>
                    )}
                  </td>
                  <td>{t.dropAddress}</td>
                  <td>
                    {t.isSellRequest ? (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#64748b', 
                        fontStyle: 'italic' 
                      }}>
                        -
                      </span>
                    ) : (
                      <StatusBadge s={t.status} />
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(() => {
                        console.log('Task:', t.title, 'isSellRequest:', t.isSellRequest);
                        return t.isSellRequest;
                      })() ? (
                        // View Details button for sell requests
                        <button 
                          className="btn" 
                          onClick={()=>{
                            const customer = t?.customerUserId?.name || t?.customerUserId?.email || 'Unknown Customer';
                            const phone = t?.customerUserId?.phoneNumber || '';
                            const count = t?.meta?.barrelCount || '1';
                            const taskId = t?._id || '';
                            const requestId = t?.meta?.sellRequestId || '';
                            
                            const qs = new URLSearchParams();
                            qs.set('customerName', String(customer));
                            qs.set('customerPhone', String(phone));
                            qs.set('barrelCount', String(count));
                            qs.set('taskId', String(taskId));
                            if (requestId) qs.set('requestId', String(requestId));
                            
                            navigate(`/delivery/barrel-intake?${qs.toString()}`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                      ) : (
                        // Action buttons for regular delivery tasks
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
                          <button className="btn-secondary" onClick={()=>deliverToLab(t)}>Notify Lab</button>
                        </>
                      )}
                    </div>
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