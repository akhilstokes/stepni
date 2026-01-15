import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignStaffModal from '../../components/shifts/AssignStaffModal';
import './ShiftManagement.css';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    late: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShifts();
    fetchTodayAttendance();
  }, []);

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shifts', {
        headers: { Authorization: `Bearer ${token}` },
        params: { isActive: true, limit: 100 }
      });
      setShifts(response.data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shift-assignments/today-attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayAttendance(response.data.attendance || []);
      setStats(response.data.stats || {
        totalAssigned: 0,
        present: 0,
        absent: 0,
        late: 0
      });
    } catch (err) {
      console.error('Error fetching today\'s attendance:', err);
    }
  };

  const handleAssignSuccess = () => {
    fetchShifts();
    fetchTodayAttendance();
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: { class: 'status-present', text: 'Present', icon: 'fa-check-circle' },
      completed: { class: 'status-completed', text: 'Completed', icon: 'fa-check-double' },
      absent: { class: 'status-absent', text: 'Absent', icon: 'fa-times-circle' }
    };
    return badges[status] || badges.absent;
  };

  if (loading) {
    return (
      <div className="shift-management">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading shift management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-management">
      <div className="shift-header">
        <div>
          <h1>
            <i className="fas fa-calendar-check"></i>
            Shift Management
          </h1>
          <p>Manage shift shifts and assignments</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAssignModal(true)}
          >
            <i className="fas fa-user-plus"></i>
            Assign Staff
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              fetchShifts();
              fetchTodayAttendance();
            }}
          >
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAssigned || 0}</div>
            <div className="stat-label">Total Staff</div>
          </div>
        </div>

        <div className="stat-card stat-present">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.present || 0}</div>
            <div className="stat-label">Present Today</div>
          </div>
        </div>

        <div className="stat-card stat-absent">
          <div className="stat-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.absent || 0}</div>
            <div className="stat-label">Absent Today</div>
          </div>
        </div>

        <div className="stat-card stat-late">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.late || 0}</div>
            <div className="stat-label">Late Today</div>
          </div>
        </div>
      </div>

      {/* Shifts Section */}
      <div className="section">
        <h2>
          <i className="fas fa-calendar-alt"></i>
          Shifts
        </h2>
        {shifts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>No shifts found. Create a shift to get started.</p>
          </div>
        ) : (
          <div className="shifts-grid">
            {shifts.map(shift => (
              <div key={shift._id} className="shift-card">
                <div className="shift-card-header">
                  <h3>{shift.name}</h3>
                  <span className={`shift-type-badge ${shift.type}`}>
                    {shift.type}
                  </span>
                </div>
                <div className="shift-card-body">
                  <div className="shift-info-row">
                    <i className="fas fa-clock"></i>
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                  <div className="shift-info-row">
                    <i className="fas fa-building"></i>
                    <span>{shift.category}</span>
                  </div>
                  <div className="shift-info-row">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{shift.location}</span>
                  </div>
                  {shift.department && (
                    <div className="shift-info-row">
                      <i className="fas fa-sitemap"></i>
                      <span>{shift.department}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Attendance */}
      <div className="section">
        <h2>
          <i className="fas fa-clipboard-check"></i>
          Today's Attendance
        </h2>
        {todayAttendance.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-user-clock"></i>
            <p>No staff assigned for today. Use "Assign Staff" to assign staff to shifts.</p>
          </div>
        ) : (
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>Time</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map(record => {
                  const badge = getStatusBadge(record.status);
                  return (
                    <tr key={record.assignmentId}>
                      <td className="staff-name-cell">
                        <div className="staff-avatar">
                          {record.staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="staff-name">{record.staff.name}</div>
                          <div className="staff-id">{record.staff.staffId || 'N/A'}</div>
                        </div>
                      </td>
                      <td>{record.staff.role}</td>
                      <td>
                        <div className="shift-name">{record.shift.name}</div>
                        <div className="shift-category">{record.shift.category}</div>
                      </td>
                      <td>{record.shift.startTime} - {record.shift.endTime}</td>
                      <td>
                        {record.checkInTime ? (
                          <span className="time-value">
                            {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="no-data">-</span>
                        )}
                      </td>
                      <td>
                        {record.checkOutTime ? (
                          <span className="time-value">
                            {new Date(record.checkOutTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="no-data">-</span>
                        )}
                      </td>
                      <td>{record.shift.location || '-'}</td>
                      <td>
                        <span className={`status-badge ${badge.class}`}>
                          <i className={`fas ${badge.icon}`}></i>
                          {badge.text}
                          {record.isLate && <span className="late-indicator"> (Late)</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Staff Modal */}
      <AssignStaffModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={handleAssignSuccess}
      />
    </div>
  );
};

export default ShiftManagement;