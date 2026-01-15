
import React, { useState } from 'react';
import './LabDashboard.css';

const LabDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBarrel, setSelectedBarrel] = useState(null);
  const [drcValue, setDrcValue] = useState('');
  const [testNotes, setTestNotes] = useState('');

  // Mock data for pending barrels from delivery staff
  const pendingBarrels = [
    { 
      barrelId: 'BRL001', 
      userId: 'USR123', 
      userName: 'John Smith',
      deliveryDate: '2025-01-02',
      deliveryStaff: 'Mike Johnson',
      vehicleNumber: 'KA01AB1234',
      status: 'PENDING_TEST'
    },
    { 
      barrelId: 'BRL002', 
      userId: 'USR124', 
      userName: 'Sarah Wilson',
      deliveryDate: '2025-01-02',
      deliveryStaff: 'Mike Johnson',
      vehicleNumber: 'KA01AB1234',
      status: 'PENDING_TEST'
    },
    { 
      barrelId: 'BRL003', 
      userId: 'USR125', 
      userName: 'David Brown',
      deliveryDate: '2025-01-01',
      deliveryStaff: 'Lisa Davis',
      vehicleNumber: 'KA02CD5678',
      status: 'PENDING_TEST'
    }
  ];

  // Mock data for completed tests
  const completedTests = [
    { 
      barrelId: 'BRL004', 
      userId: 'USR126', 
      userName: 'Emma Taylor',
      testDate: '2025-01-01',
      drcValue: 92.5,
      testNotes: 'Good quality, meets standards',
      status: 'COMPLETED',
      sentToAccountant: true
    },
    { 
      barrelId: 'BRL005', 
      userId: 'USR127', 
      userName: 'Robert Lee',
      testDate: '2025-01-01',
      drcValue: 88.3,
      testNotes: 'Acceptable quality',
      status: 'COMPLETED',
      sentToAccountant: true
    }
  ];

  const handleStartTest = (barrel) => {
    setSelectedBarrel(barrel);
    setDrcValue('');
    setTestNotes('');
  };

  const handleSubmitTest = () => {
    if (!drcValue || drcValue < 0 || drcValue > 100) {
      alert('Please enter a valid DRC value between 0 and 100');
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Submitting test results:', {
      barrelId: selectedBarrel.barrelId,
      userId: selectedBarrel.userId,
      drcValue: parseFloat(drcValue),
      testNotes,
      testDate: new Date().toISOString().split('T')[0],
      testedBy: 'Lab Staff' // This would come from auth context
    });

    alert(`Test results submitted for Barrel ${selectedBarrel.barrelId}\nDRC Value: ${drcValue}%\nResults sent to Accountant for billing.`);
    setSelectedBarrel(null);
    setDrcValue('');
    setTestNotes('');
  };

  return (
    <div className="lab-dashboard">
      <header className="dashboard-header">
        <h1>🧪 Lab Testing Dashboard</h1>
        <div className="user-info">
          <span>Lab Staff - Barrel Testing</span>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Tests ({pendingBarrels.length})
        </button>
        <button 
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Completed Tests
        </button>
        <button 
          className={activeTab === 'queue' ? 'active' : ''}
          onClick={() => setActiveTab('queue')}
        >
          Testing Queue
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'pending' && (
          <div className="pending-tests-section">
            <div className="section-header">
              <h2>Pending Barrel Tests</h2>
              <div className="stats-summary">
                <span className="stat-item">
                  <strong>{pendingBarrels.length}</strong> Barrels Awaiting Test
                </span>
              </div>
            </div>
            
            <div className="barrels-grid">
              {pendingBarrels.map((barrel) => (
                <div key={barrel.barrelId} className="barrel-card">
                  <div className="barrel-header">
                    <h3>Barrel ID: {barrel.barrelId}</h3>
                    <span className="status pending">PENDING TEST</span>
                  </div>
                  
                  <div className="barrel-details">
                    <div className="detail-row">
                      <span className="label">User:</span>
                      <span className="value">{barrel.userName} ({barrel.userId})</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Delivery Date:</span>
                      <span className="value">{barrel.deliveryDate}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Delivery Staff:</span>
                      <span className="value">{barrel.deliveryStaff}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Vehicle:</span>
                      <span className="value">{barrel.vehicleNumber}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="btn-primary"
                    onClick={() => handleStartTest(barrel)}
                  >
                    Start DRC Test
                  </button>
                </div>
              ))}
              
              {pendingBarrels.length === 0 && (
                <div className="no-data">
                  <div className="no-data-icon">🧪</div>
                  <p>No barrels pending for testing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="completed-tests-section">
            <div className="section-header">
              <h2>Completed Tests</h2>
            </div>
            
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Barrel ID</th>
                    <th>User</th>
                    <th>Test Date</th>
                    <th>DRC Value</th>
                    <th>Status</th>
                    <th>Sent to Accountant</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTests.map((test) => (
                    <tr key={test.barrelId}>
                      <td><strong>{test.barrelId}</strong></td>
                      <td>{test.userName}</td>
                      <td>{test.testDate}</td>
                      <td>
                        <span className="drc-value">{test.drcValue}%</span>
                      </td>
                      <td>
                        <span className="status completed">COMPLETED</span>
                      </td>
                      <td>
                        {test.sentToAccountant ? (
                          <span className="status sent">✓ SENT</span>
                        ) : (
                          <span className="status pending">PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="queue-section">
            <div className="section-header">
              <h2>Testing Queue Management</h2>
            </div>
            
            <div className="queue-stats">
              <div className="stat-card">
                <h3>Today's Tests</h3>
                <div className="stat-number">{completedTests.filter(t => t.testDate === '2025-01-02').length}</div>
              </div>
              <div className="stat-card">
                <h3>Pending Tests</h3>
                <div className="stat-number">{pendingBarrels.length}</div>
              </div>
              <div className="stat-card">
                <h3>Average DRC</h3>
                <div className="stat-number">
                  {completedTests.length > 0 
                    ? (completedTests.reduce((sum, test) => sum + test.drcValue, 0) / completedTests.length).toFixed(1)
                    : '0'
                  }%
                </div>
              </div>
            </div>
            
            <div className="queue-instructions">
              <h3>Testing Instructions</h3>
              <ul>
                <li>Receive barrels from delivery staff with scanned IDs</li>
                <li>Test each barrel for DRC (Distillation Recovery Coefficient) value</li>
                <li>Enter DRC percentage (0-100%)</li>
                <li>Add testing notes if required</li>
                <li>Submit results directly to Accountant for billing</li>
                <li>Do not view or modify billing calculations</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* DRC Test Modal */}
      {selectedBarrel && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>DRC Test - Barrel {selectedBarrel.barrelId}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedBarrel(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="barrel-info">
                <h3>Barrel Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Barrel ID:</span>
                    <span className="value">{selectedBarrel.barrelId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">User:</span>
                    <span className="value">{selectedBarrel.userName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">User ID:</span>
                    <span className="value">{selectedBarrel.userId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Delivery Date:</span>
                    <span className="value">{selectedBarrel.deliveryDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="test-form">
                <h3>DRC Test Results</h3>
                <div className="form-group">
                  <label htmlFor="drcValue">DRC Value (%):</label>
                  <input
                    type="number"
                    id="drcValue"
                    min="0"
                    max="100"
                    step="0.1"
                    value={drcValue}
                    onChange={(e) => setDrcValue(e.target.value)}
                    placeholder="Enter DRC percentage (0-100)"
                    className="drc-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="testNotes">Test Notes (Optional):</label>
                  <textarea
                    id="testNotes"
                    value={testNotes}
                    onChange={(e) => setTestNotes(e.target.value)}
                    placeholder="Add any observations or notes about the test..."
                    rows="3"
                    className="notes-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedBarrel(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSubmitTest}
                disabled={!drcValue}
              >
                Submit Test Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
