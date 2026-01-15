import React, { useState, useEffect } from 'react';
import './MySchedule.css';

const MySchedule = () => {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestForm, setRequestForm] = useState({
        requestDate: '',
        currentShift: '',
        requestedShift: '',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState([]);
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'list'

    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');

    // Fetch current schedule
    const fetchSchedule = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${base}/api/workers/field/shift-schedule`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setSchedule(data);
            } else {
                setError(data.message || 'Failed to load shift schedule');
            }
        } catch (error) {
            console.error('Error fetching shift schedule:', error);
            setError('Failed to load shift schedule');
        } finally {
            setLoading(false);
        }
    };

    // Fetch schedule change requests
    const fetchRequests = async () => {
        try {
            const response = await fetch(`${base}/api/workers/field/schedule-requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    useEffect(() => {
        fetchSchedule();
        fetchRequests();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch(`${base}/api/workers/field/schedule-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestForm)
            });
            
            if (response.ok) {
                setShowRequestForm(false);
                setRequestForm({
                    requestDate: '',
                    currentShift: '',
                    requestedShift: '',
                    reason: ''
                });
                fetchRequests();
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to submit request');
            }
        } catch (error) {
            setError('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="schedule-container">
                <div className="loading">Loading your schedule...</div>
            </div>
        );
    }

    return (
        <div className="schedule-container">
            <div className="schedule-header">
                <h1>My Schedule</h1>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button 
                            className={viewMode === 'week' ? 'active' : ''}
                            onClick={() => setViewMode('week')}
                        >
                            Week View
                        </button>
                        <button 
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            List View
                        </button>
                    </div>
                    <button 
                        className="request-btn"
                        onClick={() => setShowRequestForm(true)}
                    >
                        Request Schedule Change
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {schedule ? (
                <div className="schedule-content">
                    <div className="current-schedule">
                        <h3>Current Schedule</h3>
                        <div className="schedule-info">
                            <p><strong>Shift:</strong> {schedule.shift || 'Not assigned'}</p>
                            <p><strong>Start Time:</strong> {schedule.startTime || 'N/A'}</p>
                            <p><strong>End Time:</strong> {schedule.endTime || 'N/A'}</p>
                            <p><strong>Days:</strong> {schedule.workingDays ? schedule.workingDays.join(', ') : 'N/A'}</p>
                        </div>
                    </div>

                    {viewMode === 'week' && (
                        <div className="week-view">
                            <h3>This Week</h3>
                            <div className="week-grid">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <div key={day} className="day-card">
                                        <div className="day-header">{day}</div>
                                        <div className="day-content">
                                            {schedule.workingDays && schedule.workingDays.includes(day) ? (
                                                <div className="shift-info">
                                                    <span className="shift-time">
                                                        {schedule.startTime} - {schedule.endTime}
                                                    </span>
                                                    <span className="shift-type">{schedule.shift}</span>
                                                </div>
                                            ) : (
                                                <span className="off-day">Off</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="list-view">
                            <h3>Schedule Details</h3>
                            <div className="schedule-list">
                                {schedule.workingDays ? schedule.workingDays.map(day => (
                                    <div key={day} className="schedule-item">
                                        <span className="day">{day}</span>
                                        <span className="time">{schedule.startTime} - {schedule.endTime}</span>
                                        <span className="shift">{schedule.shift}</span>
                                    </div>
                                )) : (
                                    <p>No schedule assigned</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="no-schedule">
                    <p>No schedule assigned yet. Please contact your manager.</p>
                </div>
            )}

            {requests.length > 0 && (
                <div className="requests-section">
                    <h3>My Schedule Change Requests</h3>
                    <div className="requests-list">
                        {requests.map(request => (
                            <div key={request._id} className="request-item">
                                <div className="request-info">
                                    <p><strong>Date:</strong> {formatDate(request.requestDate)}</p>
                                    <p><strong>From:</strong> {request.currentShift} <strong>To:</strong> {request.requestedShift}</p>
                                    <p><strong>Reason:</strong> {request.reason}</p>
                                </div>
                                <div className={`request-status ${request.status}`}>
                                    {request.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showRequestForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Request Schedule Change</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowRequestForm(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleRequestSubmit} className="request-form">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={requestForm.requestDate}
                                    onChange={(e) => setRequestForm({...requestForm, requestDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Current Shift</label>
                                <select
                                    value={requestForm.currentShift}
                                    onChange={(e) => setRequestForm({...requestForm, currentShift: e.target.value})}
                                    required
                                >
                                    <option value="">Select current shift</option>
                                    <option value="Morning">Morning</option>
                                    <option value="Evening">Evening</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Requested Shift</label>
                                <select
                                    value={requestForm.requestedShift}
                                    onChange={(e) => setRequestForm({...requestForm, requestedShift: e.target.value})}
                                    required
                                >
                                    <option value="">Select requested shift</option>
                                    <option value="Morning">Morning</option>
                                    <option value="Evening">Evening</option>
                                    <option value="Night">Night</option>
                                    <option value="Off">Off Day</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                                    required
                                    rows={3}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowRequestForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySchedule;