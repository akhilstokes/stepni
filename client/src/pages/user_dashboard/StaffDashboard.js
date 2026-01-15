
import React, { useEffect, useState, useCallback, useRef } from 'react';
import './StaffDashboard.css';


export default function StaffDashboard() {
  const [data, setData] = useState({ worker: null, attendance: null, route: null });
  const [shiftSchedule, setShiftSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const token = localStorage.getItem('token');
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const hasLoadedRef = useRef(false);

  // Function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };


  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${apiBase}/api/workers/field/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }

  }, [token, apiBase]);

  const fetchShiftSchedule = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/workers/field/shift-schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setShiftSchedule(json);
      }
    } catch (e) {
      console.error('Failed to load shift schedule:', e);
    }
  }, [token, apiBase]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    let isActive = true;
    (async () => {
      if (!isActive) return;
      await fetchDashboard();
      if (!isActive) return;
      await fetchShiftSchedule();
    })();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  const action = async (type) => {
    try {
      const url = type === 'in' ? '/api/workers/field/attendance/check-in' : '/api/workers/field/attendance/check-out';
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Action failed');
      await fetchDashboard();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };


  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>;

  const { worker, attendance, route } = data;

  return (
    <div className="dashboard">
      <div className="header">
        <h1>{getGreeting()}, {worker?.name || 'Staff Member'}</h1>
        <p>Today is {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="cards">
        {/* Shift Card - 1st position */}
        <div className="card shift-card">
          <div className="card-header">
            <div className="icon">🕒</div>
            <h3>Today's Shift</h3>
          </div>
          <div className="card-content">
            {shiftSchedule?.myAssignment ? (
              <>
                <div className="shift-type">
                  <span className="badge">{shiftSchedule.myAssignment.shiftType} Shift</span>
                </div>
                <div className="time-slots">
                  <div className="time-slot">
                    <span className="time-label">Start</span>
                    <span className="time-value">{shiftSchedule.myAssignment.startTime}</span>
                  </div>
                  <div className="time-slot">
                    <span className="time-label">End</span>
                    <span className="time-value">{shiftSchedule.myAssignment.endTime}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data">No shift assigned for today</div>
            )}
          </div>
        </div>

        {/* Attendance Card - 2nd position */}
        <div className="card attendance-card">
          <div className="card-header">
            <div className="icon">✅</div>
            <h3>Attendance</h3>
          </div>
          <div className="card-content">
            <div className="attendance-status">
              <div className="status-item">
                <span className="status-label">Check-in</span>
                <span className="status-time">
                  {attendance?.checkInAt ? new Date(attendance.checkInAt).toLocaleTimeString() : 'Not checked in'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Check-out</span>
                <span className="status-time">
                  {attendance?.checkOutAt ? new Date(attendance.checkOutAt).toLocaleTimeString() : 'Not checked out'}
                </span>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => action('in')} 
                disabled={!!attendance?.checkInAt}
                className="btn btn-checkin"
              >
                Check In
              </button>
              <button 
                onClick={() => action('out')} 
                disabled={!attendance?.checkInAt || !!attendance?.checkOutAt}
                className="btn btn-checkout"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>

        {/* Profile Card - 3rd position */}
        <div className="card profile-card">
          <div className="card-header">
            <div className="icon">👤</div>
            <h3>My Profile</h3>
          </div>
          <div className="card-content">
            {worker ? (
              <>
                <div className="info-row">
                  <span className="label">Name</span>
                  <span className="value">{worker.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Daily Wage</span>
                  <span className="value">₹{worker.dailyWage || 0}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone</span>
                  <span className="value">{worker.contactNumber || 'Not provided'}</span>
                </div>
              </>
            ) : (
              <div className="no-data">No profile information available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}