import React, { useState, useEffect } from 'react';

const ManagerStaffSalary = () => {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [staffRes, salaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/user-management/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/salary/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(Array.isArray(staffData) ? staffData : []);
      }

      if (salaryRes.ok) {
        const salaryData = await salaryRes.json();
        setSalaryData(Array.isArray(salaryData) ? salaryData : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalaryData = selectedStaff 
    ? salaryData.filter(salary => salary.staffId === selectedStaff)
    : salaryData;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Staff Salary Management
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Manage staff salaries and payroll
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

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          >
            <option value="">All Staff</option>
            {staff.map(member => (
              <option key={member._id} value={member._id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </div>
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

      {/* Salary Records Table */}
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
                Role
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Basic Salary
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#6b7280' }}>Loading salary data...</div>
                </td>
              </tr>
            ) : filteredSalaryData.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
                    No salary records found
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>
                    Salary records will appear here when available
                  </div>
                </td>
              </tr>
            ) : (
              filteredSalaryData.map((salary, index) => {
                const staffMember = staff.find(s => s._id === salary.staffId);
                
                return (
                  <tr key={salary._id || index} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 500, color: '#1f2937' }}>
                        {staffMember?.name || 'Unknown Staff'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151' }}>
                        {staffMember?.role || 'Unknown Role'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151', fontFamily: 'monospace' }}>
                        ₹{(salary.basicSalary || 0).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: salary.status === 'paid' ? '#f0fdf4' : '#fff7ed',
                        color: salary.status === 'paid' ? '#16a34a' : '#ea580c',
                        textTransform: 'capitalize'
                      }}>
                        {salary.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerStaffSalary;