import React, { useState, useEffect } from 'react';

const LiveCheckins = () => {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCheckins();
    const interval = setInterval(fetchCheckins, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/attendance/live-checkins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckins(Array.isArray(data) ? data : []);
      } else {
        setCheckins([]);
      }
    } catch (error) {
      console.error('Error fetching live checkins:', error);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const filteredCheckins = checkins.filter(checkin => {
    const matchesSearch = !searchQuery || 
      (checkin.staffName && checkin.staffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (checkin.staff && checkin.staff.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'late' && checkin.isLate) ||
      (filterStatus === 'ontime' && !checkin.isLate);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Live Check-ins
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Monitor staff attendance in real-time
        </p>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            minWidth: 120
          }}
        >
          <option value="all">All Status</option>
          <option value="ontime">On Time</option>
          <option value="late">Late</option>
        </select>
        <button
          onClick={fetchCheckins}
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
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{
          padding: 16,
          backgroundColor: '#eff6ff',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>
            {checkins.length}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Total Checked In</div>
        </div>
        <div style={{
          padding: 16,
          backgroundColor: '#f0fdf4',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>
            {checkins.filter(c => !c.isLate).length}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>On Time</div>
        </div>
        <div style={{
          padding: 16,
          backgroundColor: '#fef2f2',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
            {checkins.filter(c => c.isLate).length}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Late</div>
        </div>
      </div>

      {/* Table */}
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
                Staff Name
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Check In Time
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Status
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#6b7280' }}>Loading...</div>
                </td>
              </tr>
            ) : filteredCheckins.length > 0 ? (
              filteredCheckins.map((checkin, index) => {
                const checkInTime = checkin.checkInAt ? new Date(checkin.checkInAt) : null;
                const duration = checkInTime ? (Date.now() - checkInTime.getTime()) : 0;
                
                return (
                  <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 500, color: '#1f2937' }}>
                        {checkin.staffName || checkin.staff || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151' }}>
                        {formatTime(checkin.checkInAt)}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: checkin.isLate ? '#fef2f2' : '#f0fdf4',
                        color: checkin.isLate ? '#dc2626' : '#16a34a'
                      }}>
                        {checkin.isLate ? 'Late' : 'On Time'}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ 
                        fontFamily: 'monospace', 
                        fontSize: 14, 
                        color: '#374151' 
                      }}>
                        {checkInTime ? formatDuration(duration) : '--:--:--'}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {searchQuery || filterStatus !== 'all' ? '🔍' : '😴'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
                    {searchQuery || filterStatus !== 'all' 
                      ? 'No matching staff found' 
                      : 'No one is currently checked in'}
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>
                    {searchQuery || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Staff will appear here when they check in'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveCheckins;