import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ReturnBarrels.css';

const ReturnBarrels = () => {
  const { user } = useAuth();
  const [scannedBarrels, setScannedBarrels] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [returnHistory, setReturnHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'history'

  // Fetch return history on mount
  useEffect(() => {
    fetchReturnHistory();
  }, []);

  // Fetch return history
  const fetchReturnHistory = async () => {
    try {
      const response = await fetch('/api/field-staff/return-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('History endpoint not available or returned non-JSON response');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setReturnHistory(data.requests || []);
      } else {
        console.log('Failed to fetch return history:', response.status);
      }
    } catch (error) {
      console.error('Error fetching return history:', error);
      // Don't show error to user, just log it
    }
  };

  // Validate barrel ID format: BHFP + 1-3 digits
  const validateBarrelId = (barrelId) => {
    const regex = /^BHFP\d{1,3}$/i;
    return regex.test(barrelId.toUpperCase());
  };

  // Handle scan input
  const handleScanInput = (e) => {
    const value = e.target.value.trim().toUpperCase();
    setScanInput(value);

    // Auto-process on Enter
    if (e.key === 'Enter' && value) {
      processBarrelScan(value);
      setScanInput('');
    }
  };

  // Process scanned barrel
  const processBarrelScan = (barrelId) => {
    if (!validateBarrelId(barrelId)) {
      showMessage('error', `Invalid barrel ID format: ${barrelId}. Use BHFP + 1-3 digits`);
      return;
    }

    if (scannedBarrels.includes(barrelId)) {
      showMessage('warning', `Barrel ${barrelId} already scanned`);
      return;
    }

    setScannedBarrels(prev => [...prev, barrelId]);
    showMessage('success', `✓ Barrel ${barrelId} added successfully`);
  };

  // Manual add barrel
  const handleManualAdd = () => {
    if (scanInput.trim()) {
      processBarrelScan(scanInput.trim().toUpperCase());
      setScanInput('');
    }
  };

  // Remove barrel from list
  const removeBarrel = (barrelId) => {
    setScannedBarrels(prev => prev.filter(id => id !== barrelId));
    showMessage('info', `Barrel ${barrelId} removed`);
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Submit return request
  const submitReturnRequest = async () => {
    if (scannedBarrels.length === 0) {
      showMessage('error', 'Please scan at least one barrel');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/field-staff/return-barrels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          barrelIds: scannedBarrels,
          reason: 'completed_route',
          notes: '',
          returnedBy: user?._id,
          returnedByName: user?.name
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please check your permissions.');
      }

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Successfully submitted ${scannedBarrels.length} barrels for return!`);
        setScannedBarrels([]);
        fetchReturnHistory(); // Refresh history
      } else {
        throw new Error(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="return-barrels-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <i className="fas fa-chevron-right"></i>
        <span>Dashboard</span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          <i className="fas fa-qrcode"></i>
          Scan Barrels
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i>
          Return History
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : message.type === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      {/* Scan Tab */}
      {activeTab === 'scan' && (
        <>
          {/* Animated Header */}
          <div className="scan-header-animated">
            <div className="scan-circle">
              <div className="scan-pulse"></div>
              <i className="fas fa-qrcode"></i>
            </div>
            <div className="scan-progress-bar">
              <div 
                className="scan-progress-fill" 
                style={{ width: scannedBarrels.length > 0 ? `${Math.min((scannedBarrels.length / 10) * 100, 100)}%` : '0%' }}
              ></div>
            </div>
          </div>

          <div className="scan-card">
            {/* Barrel ID Input */}
            <div className="scan-input-section">
              <label htmlFor="scanInput">
                <i className="fas fa-barcode"></i> Barrel ID Input:
              </label>
              <div className="input-group">
                <input
                  id="scanInput"
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                  onKeyPress={handleScanInput}
                  className="scan-input"
                  placeholder="BHFP2"
                  autoFocus
                />
                <button
                  className="btn-add-barrel"
                  onClick={handleManualAdd}
                  disabled={!scanInput.trim()}
                >
                  Add Barrel
                </button>
              </div>
            </div>

            {/* Scanned Barrels List */}
            <div className="scanned-list">
              <h3>Scanned Barrels ({scannedBarrels.length})</h3>
              {scannedBarrels.length === 0 ? (
                <div className="empty-state">
                  <p>No barrels scanned yet</p>
                </div>
              ) : (
                <div className="barrel-list">
                  {scannedBarrels.map((barrelId, index) => (
                    <div key={barrelId} className="barrel-item">
                      <div className="barrel-info">
                        <span className="barrel-id">{barrelId}</span>
                        <span className="barrel-time">Scanned at {new Date().toLocaleTimeString()}</span>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => removeBarrel(barrelId)}
                        title="Remove barrel"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="scan-actions">
              <button
                className="btn-submit"
                onClick={submitReturnRequest}
                disabled={scannedBarrels.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  <>
                    Submit Return ({scannedBarrels.length} barrels)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Format Instructions */}
          <div className="format-info">
            <div className="format-header">
              <i className="fas fa-check-circle"></i>
              <strong>Valid Barrel ID Format:</strong>
            </div>
            <div className="format-box">
              <span className="format-label">BHFP</span>
              <span className="format-plus">+</span>
              <span className="format-label">1-3 digits</span>
            </div>
            <div className="format-examples">
              <div className="example-group">
                <span className="example-title">✅ Valid:</span>
                <span className="valid-example">BHFP1</span>
                <span className="valid-example">BHFP12</span>
                <span className="valid-example">BHFP123</span>
              </div>
              <div className="example-group">
                <span className="example-title">❌ Invalid:</span>
                <span className="invalid-example">bhfp90 (lowercase)</span>
                <span className="invalid-example">BHFP1234 (4 digits)</span>
                <span className="invalid-example">abcd78 (wrong prefix)</span>
              </div>
            </div>
            <ul className="format-instructions">
              <li>Scan or manually enter barrel IDs in the correct format</li>
              <li>Each valid barrel will be added to the list</li>
              <li>Click "Complete Return" when all barrels are scanned</li>
              <li>Manager will be notified and can reassign barrels</li>
            </ul>
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          <h2>Return History</h2>
          {returnHistory.length === 0 ? (
            <div className="empty-history">
              <i className="fas fa-inbox"></i>
              <p>No return history yet</p>
              <p className="hint">Your submitted returns will appear here</p>
            </div>
          ) : (
            <div className="history-list">
              {returnHistory.map((request) => (
                <div key={request._id} className="history-card">
                  <div className="history-header">
                    <div className="history-date">
                      <i className="fas fa-calendar"></i>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <span className={`status-badge status-${request.status}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="history-body">
                    <div className="history-detail">
                      <i className="fas fa-boxes"></i>
                      <span><strong>{request.barrelIds?.length || 0}</strong> barrels returned</span>
                    </div>
                    <div className="history-detail">
                      <i className="fas fa-tag"></i>
                      <span>{request.reason?.replace(/_/g, ' ')}</span>
                    </div>
                    {request.notes && (
                      <div className="history-detail">
                        <i className="fas fa-sticky-note"></i>
                        <span>{request.notes}</span>
                      </div>
                    )}
                  </div>
                  {request.barrelIds && request.barrelIds.length > 0 && (
                    <div className="history-barrels">
                      <strong>Barrel IDs:</strong>
                      <div className="barrel-chips">
                        {request.barrelIds.map(id => (
                          <span key={id} className="barrel-chip">{id}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReturnBarrels;
