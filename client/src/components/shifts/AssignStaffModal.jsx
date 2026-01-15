import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssignStaffModal.css';

const AssignStaffModal = ({ isOpen, onClose, onSuccess }) => {
  const [shifts, setShifts] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch shifts on mount
  useEffect(() => {
    if (isOpen) {
      fetchShifts();
      setSelectedDate(getTodayDate());
    }
  }, [isOpen]);

  // Fetch available staff when shift and date are selected
  useEffect(() => {
    if (selectedShift && selectedDate) {
      fetchAvailableStaff();
    }
  }, [selectedShift, selectedDate]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

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
    }
  };

  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shift-assignments/available-staff', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          shiftId: selectedShift,
          date: selectedDate
        }
      });
      setAvailableStaff(response.data.available || []);
      setAllStaff([...response.data.available, ...response.data.unavailable]);
    } catch (err) {
      console.error('Error fetching available staff:', err);
      setError('Failed to load available staff');
      setAvailableStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleStaffToggle = (staffId) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredStaff = getFilteredStaff();
    const allIds = filteredStaff.map(staff => staff._id);
    setSelectedStaffIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedStaffIds([]);
  };

  const getFilteredStaff = () => {
    if (!searchTerm) return availableStaff;
    
    const term = searchTerm.toLowerCase();
    return availableStaff.filter(staff => 
      staff.name.toLowerCase().includes(term) ||
      staff.email.toLowerCase().includes(term) ||
      (staff.staffId && staff.staffId.toLowerCase().includes(term))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedShift) {
      setError('Please select a shift');
      return;
    }
    
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    if (selectedStaffIds.length === 0) {
      setError('Please select at least one staff member');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/shift-assignments/assign',
        {
          shiftId: selectedShift,
          staffIds: selectedStaffIds,
          date: selectedDate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { summary, details } = response.data;
      
      let successMsg = `Successfully assigned ${summary.successful} staff member(s)`;
      if (summary.duplicates > 0) {
        successMsg += `, ${summary.duplicates} already assigned`;
      }
      if (summary.conflicts > 0) {
        successMsg += `, ${summary.conflicts} had conflicts`;
      }
      
      setSuccess(successMsg);
      
      // Show detailed errors if any
      if (details.conflicts.length > 0) {
        const conflictNames = details.conflicts.map(c => `${c.staffName}: ${c.reason}`).join('; ');
        setError(`Conflicts: ${conflictNames}`);
      }

      // Reset form after short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error assigning staff:', err);
      setError(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedShift('');
    setSelectedDate(getTodayDate());
    setSelectedStaffIds([]);
    setSearchTerm('');
    setError('');
    setSuccess('');
    setShowDropdown(false);
    onClose();
  };

  const getSelectedStaffNames = () => {
    return availableStaff
      .filter(staff => selectedStaffIds.includes(staff._id))
      .map(staff => staff.name)
      .join(', ');
  };

  if (!isOpen) return null;

  const filteredStaff = getFilteredStaff();
  const selectedShiftData = shifts.find(s => s._id === selectedShift);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="assign-staff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Staff to Shift</h2>
          <button className="close-btn" onClick={handleClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Shift Selection */}
          <div className="form-group">
            <label htmlFor="shift">Select Shift *</label>
            <select
              id="shift"
              value={selectedShift}
              onChange={(e) => {
                setSelectedShift(e.target.value);
                setSelectedStaffIds([]);
              }}
              required
              className="form-control"
            >
              <option value="">-- Select a Shift --</option>
              {shifts.map(shift => (
                <option key={shift._id} value={shift._id}>
                  {shift.name} ({shift.startTime} - {shift.endTime}) - {shift.category}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="form-group">
            <label htmlFor="date">Select Date *</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedStaffIds([]);
              }}
              required
              className="form-control"
              min={getTodayDate()}
            />
          </div>

          {/* Shift Info */}
          {selectedShiftData && (
            <div className="shift-info">
              <strong>Shift Details:</strong> {selectedShiftData.name} | 
              {selectedShiftData.startTime} - {selectedShiftData.endTime} | 
              {selectedShiftData.type} | {selectedShiftData.category}
            </div>
          )}

          {/* Staff Multi-Select */}
          {selectedShift && selectedDate && (
            <div className="form-group">
              <label>Select Staff Members *</label>
              
              {loadingStaff ? (
                <div className="loading-staff">Loading available staff...</div>
              ) : (
                <>
                  {/* Selected Staff Display */}
                  <div 
                    className="staff-select-display"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {selectedStaffIds.length === 0 ? (
                      <span className="placeholder">Click to select staff members...</span>
                    ) : (
                      <span className="selected-count">
                        {selectedStaffIds.length} staff member(s) selected
                      </span>
                    )}
                    <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="staff-dropdown">
                      {/* Search */}
                      <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search staff by name, email, or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>

                      {/* Select All / Deselect All */}
                      <div className="dropdown-actions">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="action-btn"
                        >
                          Select All ({filteredStaff.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="action-btn"
                        >
                          Deselect All
                        </button>
                      </div>

                      {/* Staff List */}
                      <div className="staff-list">
                        {filteredStaff.length === 0 ? (
                          <div className="no-staff">
                            {searchTerm ? 'No staff found matching search' : 'No available staff for this shift'}
                          </div>
                        ) : (
                          filteredStaff.map(staff => (
                            <label key={staff._id} className="staff-item">
                              <input
                                type="checkbox"
                                checked={selectedStaffIds.includes(staff._id)}
                                onChange={() => handleStaffToggle(staff._id)}
                              />
                              <div className="staff-info">
                                <div className="staff-name">{staff.name}</div>
                                <div className="staff-details">
                                  {staff.email} | {staff.staffId || 'No ID'} | {staff.role}
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Staff Tags */}
                  {selectedStaffIds.length > 0 && (
                    <div className="selected-staff-tags">
                      {availableStaff
                        .filter(staff => selectedStaffIds.includes(staff._id))
                        .map(staff => (
                          <span key={staff._id} className="staff-tag">
                            {staff.name}
                            <button
                              type="button"
                              onClick={() => handleStaffToggle(staff._id)}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedShift || !selectedDate || selectedStaffIds.length === 0}
            >
              {loading ? 'Assigning...' : `Assign ${selectedStaffIds.length} Staff`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignStaffModal;
