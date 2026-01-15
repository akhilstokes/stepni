import React, { useState, useEffect } from 'react';

const ManagerWages = () => {
  const [staff, setStaff] = useState([]);
  const [wages, setWages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [showWageForm, setShowWageForm] = useState(false);
  const [wageForm, setWageForm] = useState({
    staffId: '',
    dailyRate: 0,
    hoursWorked: 8,
    overtimeHours: 0,
    overtimeRate: 1.5,
    date: new Date().toISOString().split('T')[0]
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

      const [staffRes, wagesRes] = await Promise.all([
        fetch(`${API_BASE}/api/user-management/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/wages/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(Array.isArray(staffData) ? staffData : []);
      }

      if (wagesRes.ok) {
        const wagesData = await wagesRes.json();
        setWages(Array.isArray(wagesData) ? wagesData : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWage = async (e) => {
    e.preventDefault();
    
    if (!wageForm.staffId || !wageForm.dailyRate) {
      setError('Please select staff and enter daily rate');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/wages/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(wageForm)
      });

      if (response.ok) {
        setMessage('Wage record created successfully');
        setShowWageForm(false);
        setWageForm({
          staffId: '',
          dailyRate: 0,
          hoursWorked: 8,
          overtimeHours: 0,
          overtimeRate: 1.5,
          date: new Date().toISOString().split('T')[0]
        });
        await fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to create wage record');
      }
    } catch (err) {
      console.error('Error creating wage:', err);
      setError('Failed to create wage record');
    }
  };

  const calculateTotalWage = (wage) => {
    const regularPay = (wage.dailyRate || 0) * (wage.hoursWorked || 8) / 8;
    const overtimePay = (wage.overtimeHours || 0) * (wage.dailyRate || 0) / 8 * (wage.overtimeRate || 1.5);
    return regularPay + overtimePay;
  };

  const filteredWages = selectedStaff 
    ? wages.filter(wage => wage.staffId === selectedStaff)
    : wages;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Wages Management
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Manage daily wages and overtime payments
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
          onClick={() => setShowWageForm(true)}
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
          Add Wage Entry
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

      {/* Wage Form Modal */}
      {showWageForm && (
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
            width: '90%'
          }}>
            <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
              Add Wage Entry
            </h3>
            
            <form onSubmit={handleCreateWage}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Staff Member *
                </label>
                <select
                  value={wageForm.staffId}
                  onChange={(e) => setWageForm(prev => ({ ...prev, staffId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  required
                >
                  <option value="">Select staff member</option>
                  {staff.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Daily Rate *
                  </label>
                  <input
                    type="number"
                    value={wageForm.dailyRate}
                    onChange={(e) => setWageForm(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={wageForm.date}
                    onChange={(e) => setWageForm(prev => ({ ...prev, date: e.target.value }))}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    value={wageForm.hoursWorked}
                    onChange={(e) => setWageForm(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) || 8 }))}
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
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    value={wageForm.overtimeHours}
                    onChange={(e) => setWageForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
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

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowWageForm(false)}
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
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wages Table */}
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
                Date
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Daily Rate
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Hours
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Total Wage
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#6b7280' }}>Loading wage data...</div>
                </td>
              </tr>
            ) : filteredWages.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
                    No wage records found
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>
                    Add wage entries to track daily payments
                  </div>
                </td>
              </tr>
            ) : (
              filteredWages.map((wage, index) => {
                const staffMember = staff.find(s => s._id === wage.staffId);
                const totalWage = calculateTotalWage(wage);
                
                return (
                  <tr key={wage._id || index} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 500, color: '#1f2937' }}>
                        {staffMember?.name || 'Unknown Staff'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151' }}>
                        {wage.date ? new Date(wage.date).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151', fontFamily: 'monospace' }}>
                        ₹{(wage.dailyRate || 0).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151' }}>
                        {wage.hoursWorked || 8}h
                        {wage.overtimeHours > 0 && (
                          <span style={{ color: '#ea580c', fontSize: 12, marginLeft: 4 }}>
                            +{wage.overtimeHours}h OT
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#16a34a', fontFamily: 'monospace', fontWeight: 600 }}>
                        ₹{totalWage.toLocaleString()}
                      </div>
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

export default ManagerWages;