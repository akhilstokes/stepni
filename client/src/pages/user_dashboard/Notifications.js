import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Notifications.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API}/api/notifications`, { headers });
        const data = res.data;
        const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
        
        // Filter notifications for regular users - ONLY price updates and approvals
        const filteredList = list.filter(notif => {
          const category = (notif.category || '').toLowerCase();
          const title = (notif.title || '').toLowerCase();
          const message = (notif.message || '').toLowerCase();
          
          // EXCLUDE pickup/delivery/operational notifications
          if (title.includes('pickup') || title.includes('delivery') || title.includes('scheduled') ||
              message.includes('pickup') || message.includes('delivery') || message.includes('scheduled')) {
            return false;
          }
          
          // ONLY INCLUDE: Price/Rate updates
          if (category.includes('rate') || category.includes('price') || category.includes('live_rate')) {
            return true;
          }
          if (title.includes('rate') || title.includes('price') || title.includes('live rate')) {
            return true;
          }
          
          // ONLY INCLUDE: Approval/Rejection notifications
          if (title.includes('approved') || title.includes('rejected') || title.includes('approval')) {
            return true;
          }
          if (message.includes('approved') || message.includes('rejected') || message.includes('approval')) {
            return true;
          }
          
          return false;
        });
        
        setItems(filteredList);
      } catch (e) {
        console.error('Error loading notifications:', e);
        // Fallback to default notifications
        setItems([
          { id: 'n1', title: 'Welcome to HFP', message: 'Your account is ready.', createdAt: new Date().toISOString(), read: false },
          { id: 'n2', title: 'Rate Update', message: 'New live rate is available.', createdAt: new Date().toISOString(), read: false },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markAsRead = async (id) => {
    // Optimistic update
    setItems(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/api/notifications/${id}/read`, {}, { 
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      // Rollback on failure
      setItems(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: false } : n));
      console.error('Failed to mark notification as read:', e);
    }
  };

  const clearAll = async () => {
    const backup = items;
    setItems([]);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/notifications/clear`, {}, { 
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      setItems(backup);
      console.error('Failed to clear notifications:', e);
    }
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
      taskId: 'Task ID',
      scheduledAt: 'Scheduled At'
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
    if (lower.includes('pickup') || lower.includes('scheduled')) return '📦';
    if (lower.includes('sample')) return '🔬';
    if (lower.includes('delivery')) return '🚚';
    if (lower.includes('payment') || lower.includes('bill')) return '💳';
    return '📋';
  };

  const unreadCount = items.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="notif-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-container">
      <div className="notif-header">
        <div className="header-content">
          <h1 className="notif-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} new</span>
          )}
        </div>
        <div className="notif-actions">
          <button className="btn-clear" onClick={clearAll} disabled={items.length === 0}>
            Clear All
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <p className="empty-text">No notifications at the moment</p>
          <p className="empty-subtext">You're all caught up!</p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => (
            <div key={n._id || n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <div className="notif-icon">{getNotificationIcon(n.title)}</div>
              <div className="notif-content">
                <div className="notif-item-title">{n.title || 'Notification'}</div>
                <div className="notif-message">{n.message}</div>
                
                {n.meta && formatMetadata(n.meta) && formatMetadata(n.meta).length > 0 && (
                  <div className="notif-metadata">
                    {formatMetadata(n.meta).map((item, idx) => (
                      <span key={idx} className="metadata-tag">
                        <strong>{item.label}:</strong> {item.value}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="notif-time">
                  {new Date(n.createdAt || Date.now()).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="notif-actions-col">
                {n.link && (
                  <button className="btn-open" onClick={() => window.location.href = n.link}>
                    Open
                  </button>
                )}
                {!n.read && (
                  <button 
                    className="btn-mark" 
                    onClick={() => markAsRead(n._id || n.id)} 
                    title="Mark as read"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;