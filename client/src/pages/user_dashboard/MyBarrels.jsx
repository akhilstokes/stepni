import React, { useState, useEffect } from 'react';
import './userDashboardTheme.css';

const MyBarrels = () => {
  const [barrels, setBarrels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, inUse: 0, available: 0 });

  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyBarrels();
  }, []);

  const fetchMyBarrels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${base}/api/barrels/my-assigned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch barrels');
      }

      const data = await response.json();
      const barrelList = data.records || [];
      setBarrels(barrelList);

      // Calculate stats
      const total = barrelList.length;
      const inUse = barrelList.filter(b => b.status === 'in-use').length;
      const available = barrelList.filter(b => b.status === 'available' || b.status === 'idle').length;
      
      setStats({ total, inUse, available });
    } catch (err) {
      console.error('Error fetching barrels:', err);
      setError(err.message);
      setBarrels([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'in-use': '#10b981',
      'available': '#3b82f6',
      'idle': '#6b7280',
      'maintenance': '#f59e0b',
      'damaged': '#ef4444'
    };
    return statusMap[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'in-use': 'fa-check-circle',
      'available': 'fa-circle',
      'idle': 'fa-pause-circle',
      'maintenance': 'fa-tools',
      'damaged': 'fa-exclamation-triangle'
    };
    return iconMap[status] || 'fa-circle';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#10b981' }}></i>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading your barrels...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fas fa-box" style={{ color: '#10b981' }}></i>
          My Barrels
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
          View and manage your assigned barrels
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c33',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            Total Barrels
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {stats.total}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            In Use
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {stats.inUse}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Available
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {stats.available}
          </div>
        </div>
      </div>

      {/* Barrels List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#0f172a' }}>
            Barrel Details
          </h2>
          <button
            onClick={fetchMyBarrels}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>

        {barrels.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              No Barrels Assigned
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Request barrels from the admin to get started
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Barrel ID
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Capacity
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Assigned Date
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {barrels.map((barrel) => (
                  <tr
                    key={barrel._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{
                      padding: '14px 16px',
                      fontWeight: '600',
                      color: '#0f172a',
                      fontSize: '0.875rem'
                    }}>
                      {barrel.barrelId || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: `${getStatusColor(barrel.status)}15`,
                        color: getStatusColor(barrel.status)
                      }}>
                        <i className={`fas ${getStatusIcon(barrel.status)}`}></i>
                        {barrel.status || 'Unknown'}
                      </span>
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#475569',
                      fontSize: '0.875rem'
                    }}>
                      {barrel.capacity || '200L'}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#475569',
                      fontSize: '0.875rem'
                    }}>
                      {barrel.assignedDate
                        ? new Date(barrel.assignedDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#475569',
                      fontSize: '0.875rem'
                    }}>
                      {barrel.lastKnownLocation || 'Not specified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fas fa-info-circle" style={{ color: '#3b82f6' }}></i>
          About Your Barrels
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: '1.5rem',
          color: '#475569',
          lineHeight: '1.8',
          fontSize: '0.875rem'
        }}>
          <li>Barrels are assigned to you after admin approval of your request</li>
          <li>Delivery staff will bring the barrels to your specified location</li>
          <li>You can use these barrels to collect and sell latex</li>
          <li>Return barrels when requested by the company</li>
          <li>Contact support if you notice any damaged barrels</li>
        </ul>
      </div>
    </div>
  );
};

export default MyBarrels;
