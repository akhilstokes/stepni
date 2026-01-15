import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 
    Authorization: `Bearer ${token}`, 
    'Content-Type': 'application/json' 
  } : { 
    'Content-Type': 'application/json' 
  };
}

const ManagerBarrelAllocation = () => {
  const [barrels, setBarrels] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const [barrelsRes, usersRes] = await Promise.all([
        fetch(`${API}/api/barrels`, { headers: authHeaders() }),
        fetch(`${API}/api/user-management/staff?role=user&status=active&limit=500`, { headers: authHeaders() })
      ]);

      if (!barrelsRes.ok) {
        throw new Error(`Failed to load barrels (${barrelsRes.status})`);
      }
      
      if (!usersRes.ok) {
        throw new Error(`Failed to load users (${usersRes.status})`);
      }

      const barrelsData = await barrelsRes.json();
      const usersData = await usersRes.json();

      setBarrels(Array.isArray(barrelsData) ? barrelsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBarrelSelect = (barrelId) => {
    setSelected(prev => {
      if (prev.includes(barrelId)) {
        return prev.filter(id => id !== barrelId);
      } else {
        return [...prev, barrelId];
      }
    });
  };

  const handleAllocate = async () => {
    if (!recipient || selected.length === 0) {
      setError('Please select a recipient and at least one barrel');
      return;
    }

    const confirmed = window.confirm(
      `Allocate ${selected.length} barrel(s) to the selected user?`
    );

    if (!confirmed) return;

    setDispatching(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API}/api/barrels/allocate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          barrelIds: selected,
          recipientId: recipient,
          allocatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Allocation failed (${response.status})`);
      }

      const result = await response.json();
      setMessage(`Successfully allocated ${selected.length} barrel(s)`);
      setSelected([]);
      setRecipient('');
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error allocating barrels:', err);
      setError(err.message || 'Failed to allocate barrels');
    } finally {
      setDispatching(false);
    }
  };

  const availableBarrels = barrels.filter(barrel => 
    !barrel.assignedTo && barrel.status === 'available'
  );

  const selectedUser = users.find(user => user._id === recipient);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Barrel Allocation
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Allocate barrels to users
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

      {/* User Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          Select Recipient
        </label>
        <select
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14
          }}
        >
          <option value="">Choose a user...</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        {selectedUser && (
          <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
            Selected: {selectedUser.name} - {selectedUser.email}
          </div>
        )}
      </div>

      {/* Barrel Selection */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Available Barrels</h3>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            {selected.length} selected of {availableBarrels.length} available
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 16, color: '#6b7280' }}>Loading barrels...</div>
          </div>
        ) : availableBarrels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
              No available barrels
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              All barrels are currently allocated or unavailable
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={selected.length === availableBarrels.length && availableBarrels.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(availableBarrels.map(b => b._id));
                        } else {
                          setSelected([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Barrel ID
                  </th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Type
                  </th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Status
                  </th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {availableBarrels.map((barrel, index) => (
                  <tr key={barrel._id} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                    <td style={{ padding: 12 }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(barrel._id)}
                        onChange={() => handleBarrelSelect(barrel._id)}
                      />
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 500, color: '#1f2937' }}>
                        {barrel.barrelId || barrel._id}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#374151' }}>
                        {barrel.type || 'Standard'}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a'
                      }}>
                        {barrel.status || 'Available'}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ color: '#6b7280', fontSize: 14 }}>
                        {barrel.createdAt ? new Date(barrel.createdAt).toLocaleDateString() : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          onClick={loadData}
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
        <button
          onClick={handleAllocate}
          disabled={!recipient || selected.length === 0 || dispatching}
          style={{
            padding: '8px 16px',
            backgroundColor: (!recipient || selected.length === 0 || dispatching) ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: (!recipient || selected.length === 0 || dispatching) ? 'not-allowed' : 'pointer'
          }}
        >
          {dispatching ? 'Allocating...' : `Allocate ${selected.length} Barrel(s)`}
        </button>
      </div>
    </div>
  );
};

export default ManagerBarrelAllocation;