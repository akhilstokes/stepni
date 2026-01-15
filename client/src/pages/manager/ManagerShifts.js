import React, { useState, useEffect } from 'react';

const ManagerShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShift, setNewShift] = useState({
    title: '',
    startTime: '',
    endTime: '',
    date: '',
    assignedStaff: '',
    type: 'morning'
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [shiftsRes, staffRes] = await Promise.all([
        fetch(`${API_BASE}/api/shifts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/user-management/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(Array.isArray(staffData) ? staffData : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    
    if (!newShift.title || !newShift.startTime || !newShift.endTime || !newShift.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newShift)
      });

      if (response.ok) {
        setMessage('Shift created successfully');
        setShowCreateForm(false);
        setNewShift({
          title: '',
          startTime: '',
          endTime: '',
          date: '',
          assignedStaff: '',
          type: 'morning'
        });
        await fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to create shift');
      }
    } catch (err) {
      console.error('Error creating shift:', err);
      setError('Failed to create shift');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('Shift deleted successfully');
        await fetchData();
      } else {
        setError('Failed to delete shift');
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError('Failed to delete shift');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Shift Planning
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Plan and manage staff shifts
        </p>
      </div>

      {error && (
        <div style={{
          padding: 12,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          color: '#dc2626',
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          padding: 12,
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 6,
          color: '#16a34a',
          marginBottom: 16
        }}>
          {message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Create New Shift
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Refresh
        </button>
      </div>

      {/* Create Shift Form */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
              Create New Shift
            </h3>
            
            <form onSubmit={handleCreateShift}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Shift Title *
                </label>
                <input
                  type="text"
                  value={newShift.title}
                  onChange={(e) => setNewShift(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="e.g., Morning Collection Shift"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Assign Staff
                </label>
                <select
                  value={newShift.assignedStaff}
                  onChange={(e) => setNewShift(prev => ({ ...prev, assignedStaff: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="">Select staff member (optional)</option>
                  {staff.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Shift Type
                </label>
                <select
                  value={newShift.type}
                  onChange={(e) => setNewShift(prev => ({ ...prev, type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shifts Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Shift Title
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Date
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Time
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Assigned Staff
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Type
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#6b7280' }}>Loading shifts...</div>
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
                    No shifts planned
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>
                    Create your first shift to get started
                  </div>
                </td>
              </tr>
            ) : (
              shifts.map((shift, index) => (
                <tr key={shift._id || index} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 500, color: '#1f2937' }}>
                      {shift.title || 'Untitled Shift'}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ color: '#374151' }}>
                      {formatDate(shift.date)}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ color: '#374151' }}>
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ color: '#374151' }}>
                      {shift.assignedStaff?.name || 'Unassigned'}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      textTransform: 'capitalize'
                    }}>
                      {shift.type || 'Standard'}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleDeleteShift(shift._id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerShifts;