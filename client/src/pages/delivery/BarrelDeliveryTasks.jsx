import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiPackage, FiMapPin, FiCalendar, FiUser, FiRefreshCw, FiCheckCircle, FiClock } from 'react-icons/fi';
import './BarrelDeliveryTasks.css';

const BarrelDeliveryTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/barrels/my-delivery-tasks`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading delivery tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (taskId) => {
    if (!window.confirm('Mark this delivery as completed?')) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/barrels/complete-delivery/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        alert('✅ Delivery marked as completed!');
        loadTasks();
      } else {
        alert('❌ Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('❌ Error updating delivery status');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.deliveryStatus !== 'delivered';
    if (filter === 'completed') return task.deliveryStatus === 'delivered';
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: '#f59e0b', icon: <FiClock />, text: 'Pending' },
      'in_transit': { color: '#3b82f6', icon: <FiPackage />, text: 'In Transit' },
      'delivered': { color: '#10b981', icon: <FiCheckCircle />, text: 'Delivered' }
    };
    return badges[status] || badges['pending'];
  };

  return (
    <div className="barrel-delivery-tasks">
      <div className="page-header">
        <div className="header-content">
          <h1><FiPackage /> My Barrel Delivery Tasks</h1>
          <p>Manage your assigned barrel deliveries</p>
        </div>
        <button className="btn-refresh" onClick={loadTasks} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({tasks.filter(t => t.deliveryStatus !== 'delivered').length})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({tasks.filter(t => t.deliveryStatus === 'delivered').length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="tasks-container">
        {loading ? (
          <div className="loading-state">
            <FiRefreshCw className="spin" />
            <p>Loading your delivery tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <FiPackage size={64} />
            <h3>No Delivery Tasks</h3>
            <p>
              {filter === 'all'
                ? 'You have no assigned barrel deliveries yet'
                : `No ${filter} deliveries found`}
            </p>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map((task) => {
              const statusBadge = getStatusBadge(task.deliveryStatus || 'pending');
              return (
                <div key={task._id} className="task-card">
                  <div className="task-header">
                    <div className="task-id">
                      <FiPackage />
                      <span>Request #{task._id.slice(-6)}</span>
                    </div>
                    <div
                      className="status-badge"
                      style={{ background: statusBadge.color }}
                    >
                      {statusBadge.icon}
                      <span>{statusBadge.text}</span>
                    </div>
                  </div>

                  <div className="task-body">
                    {/* Customer Info */}
                    <div className="info-section">
                      <div className="info-label">
                        <FiUser /> Customer
                      </div>
                      <div className="info-value">
                        <strong>{task.user?.name || 'Unknown'}</strong>
                        <span className="email">{task.user?.email}</span>
                      </div>
                    </div>

                    {/* Barrel Info */}
                    <div className="info-section">
                      <div className="info-label">
                        <FiPackage /> Barrels to Deliver
                      </div>
                      <div className="info-value">
                        <strong>{task.quantity} barrel(s)</strong>
                        {task.assignedBarrels && task.assignedBarrels.length > 0 && (
                          <div className="barrel-ids">
                            {task.assignedBarrels.map((barrelId) => (
                              <span key={barrelId} className="barrel-id-chip">
                                {barrelId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Location */}
                    <div className="info-section">
                      <div className="info-label">
                        <FiMapPin /> Delivery Location
                      </div>
                      <div className="info-value">
                        {task.deliveryLocation || task.user?.address || 'Not specified'}
                      </div>
                    </div>

                    {/* Delivery Date */}
                    <div className="info-section">
                      <div className="info-label">
                        <FiCalendar /> {task.deliveryStatus === 'delivered' ? 'Delivered On' : 'Scheduled Date'}
                      </div>
                      <div className="info-value">
                        {task.deliveryStatus === 'delivered' && task.deliveredAt ? (
                          <>
                            <strong>
                              {new Date(task.deliveredAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </strong>
                            <span className="email">
                              at {new Date(task.deliveredAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        ) : task.deliveryDate ? (
                          new Date(task.deliveryDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        ) : (
                          'Not scheduled'
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {task.notes && (
                      <div className="info-section">
                        <div className="info-label">Notes</div>
                        <div className="info-value notes">{task.notes}</div>
                      </div>
                    )}
                  </div>

                  <div className="task-actions">
                    {task.deliveryStatus !== 'delivered' ? (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => markAsDelivered(task._id)}
                        >
                          <FiCheckCircle /> Mark as Delivered
                        </button>
                        {task.deliveryLocation && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              task.deliveryLocation
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                          >
                            <FiMapPin /> Open in Maps
                          </a>
                        )}
                        {task.user?.phoneNumber && (
                          <a
                            href={`tel:${task.user.phoneNumber}`}
                            className="btn-secondary"
                          >
                            📞 Call Customer
                          </a>
                        )}
                      </>
                    ) : (
                      <div className="delivered-badge">
                        <FiCheckCircle /> Delivered Successfully
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarrelDeliveryTasks;
