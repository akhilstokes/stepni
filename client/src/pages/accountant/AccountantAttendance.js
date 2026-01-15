import React, { useState, useEffect, useMemo } from 'react';
import { FiClock, FiSearch, FiCheckCircle, FiXCircle, FiCalendar } from 'react-icons/fi';
import './AccountantAttendance.css';

const AccountantAttendance = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [attendance, setAttendance] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAttendance();
    fetchStaff();
  }, [dateFilter, statusFilter]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/users?role=staff,delivery_staff,lab`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.users || data || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const from = dateFilter;
      const to = dateFilter;

      const response = await fetch(`${base}/api/workers/attendance?from=${from}&to=${to}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    let filtered = attendance;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.staff?.name?.toLowerCase().includes(term) ||
        record.staff?.email?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    return filtered;
  }, [attendance, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present': return 'badge-present';
      case 'absent': return 'badge-absent';
      case 'half-day': return 'badge-half-day';
      case 'leave': return 'badge-leave';
      default: return 'badge-absent';
    }
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-title">
          <h1>Attendance Management</h1>
          <p className="header-subtitle">View and manage staff attendance records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-info">
            <p className="label">Total Staff</p>
            <p className="value">{staff.length}</p>
          </div>
          <div className="summary-icon icon-blue">
            <FiClock />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-info">
            <p className="label">Present</p>
            <p className="value text-green">
              {attendance.filter(a => a.status === 'present').length}
            </p>
          </div>
          <div className="summary-icon icon-green">
            <FiCheckCircle />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-info">
            <p className="label">Absent</p>
            <p className="value text-red">
              {attendance.filter(a => a.status === 'absent').length}
            </p>
          </div>
          <div className="summary-icon icon-red">
            <FiXCircle />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-info">
            <p className="label">On Leave</p>
            <p className="value text-blue">
              {attendance.filter(a => a.status === 'leave').length}
            </p>
          </div>
          <div className="summary-icon icon-purple">
            <FiCalendar />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="search-wrapper">
          <label htmlFor="attendance-search" className="sr-only">Search attendance</label>
          <FiSearch className="search-icon" />
          <input
            id="attendance-search"
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-date"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="half-day">Half Day</option>
          <option value="leave">On Leave</option>
        </select>
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No attendance records found for this date
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-name">{record.staff?.name || 'Unknown'}</div>
                        <div className="user-email">{record.staff?.email || '-'}</div>
                      </div>
                    </td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{formatTime(record.checkInAt)}</td>
                    <td>{formatTime(record.checkOutAt)}</td>
                    <td>{record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status || 'absent'}
                      </span>
                    </td>
                    <td>
                      {record.verified ? (
                        <span className="status-badge badge-verified">Verified</span>
                      ) : (
                        <span className="status-badge badge-pending">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountantAttendance;