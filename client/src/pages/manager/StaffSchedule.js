import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffSchedule.css';

const StaffSchedule = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6); // 7 days total (including start date)
    return date.toISOString().split('T')[0];
  });
  const [selectAll, setSelectAll] = useState(false);
  const [schedules, setSchedules] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/all-staff', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStaff(response.data.staff);
        // Initialize schedules state
        const initialSchedules = {};
        response.data.staff.forEach(s => {
          initialSchedules[s._id] = {
            selected: false,
            shift: 'morning'
          };
        });
        setSchedules(initialSchedules);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    const updatedSchedules = { ...schedules };
    Object.keys(updatedSchedules).forEach(staffId => {
      updatedSchedules[staffId].selected = checked;
    });
    setSchedules(updatedSchedules);
  };

  const handleStaffSelect = (staffId, checked) => {
    setSchedules(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        selected: checked
      }
    }));
  };

  const handleShiftChange = (staffId, shift) => {
    setSchedules(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        shift: shift
      }
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Calculate all dates in the week range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Prepare schedule data for selected staff for all dates in the week
      const scheduleData = [];
      Object.entries(schedules)
        .filter(([_, data]) => data.selected)
        .forEach(([staffId, data]) => {
          dates.forEach(date => {
            scheduleData.push({
              staffId,
              date,
              shift: data.shift
            });
          });
        });

      if (scheduleData.length === 0) {
        alert('Please select at least one staff member');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/manager/schedule/bulk-assign',
        { schedules: scheduleData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const dayCount = dates.length;
        const staffCount = Object.values(schedules).filter(s => s.selected).length;
        alert(`Schedule saved successfully for ${staffCount} staff member(s) across ${dayCount} day(s)!`);
        // Reset selections
        setSelectAll(false);
        const resetSchedules = { ...schedules };
        Object.keys(resetSchedules).forEach(staffId => {
          resetSchedules[staffId].selected = false;
        });
        setSchedules(resetSchedules);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      'field_staff': 'role-field',
      'delivery_staff': 'role-delivery',
      'lab_staff': 'role-lab',
      'manager': 'role-manager',
      'accountant': 'role-accountant',
      'staff': 'role-staff'
    };
    return roleMap[role] || 'role-default';
  };

  const formatRole = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="schedule-container">
        <div className="loading-state">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h1 className="schedule-title">Staff Schedule Management</h1>
        <p className="schedule-subtitle">Assign shifts to staff members</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="schedule-controls">
        <div className="control-group">
          <label className="control-label">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="control-group">
          <label className="control-label">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="select-all-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="checkbox-input"
            />
            <span className="checkbox-text">Select All Staff</span>
          </label>
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="btn-save-schedule"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Staff Name</th>
              <th>Role</th>
              <th>Shift</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  No staff members found
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member._id} className={schedules[member._id]?.selected ? 'row-selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={schedules[member._id]?.selected || false}
                      onChange={(e) => handleStaffSelect(member._id, e.target.checked)}
                      className="checkbox-input"
                    />
                  </td>
                  <td className="staff-name">{member.name}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                      {formatRole(member.role)}
                    </span>
                  </td>
                  <td>
                    <div className="shift-selector">
                      <label className="shift-option">
                        <input
                          type="radio"
                          name={`shift-${member._id}`}
                          value="morning"
                          checked={schedules[member._id]?.shift === 'morning'}
                          onChange={() => handleShiftChange(member._id, 'morning')}
                          disabled={!schedules[member._id]?.selected}
                        />
                        <span>Morning</span>
                      </label>
                      <label className="shift-option">
                        <input
                          type="radio"
                          name={`shift-${member._id}`}
                          value="evening"
                          checked={schedules[member._id]?.shift === 'evening'}
                          onChange={() => handleShiftChange(member._id, 'evening')}
                          disabled={!schedules[member._id]?.selected}
                        />
                        <span>Evening</span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="schedule-summary">
        <div className="summary-card">
          <span className="summary-label">Total Staff:</span>
          <span className="summary-value">{staff.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Selected:</span>
          <span className="summary-value">
            {Object.values(schedules).filter(s => s.selected).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Morning Shift:</span>
          <span className="summary-value">
            {Object.values(schedules).filter(s => s.selected && s.shift === 'morning').length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Evening Shift:</span>
          <span className="summary-value">
            {Object.values(schedules).filter(s => s.selected && s.shift === 'evening').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StaffSchedule;
