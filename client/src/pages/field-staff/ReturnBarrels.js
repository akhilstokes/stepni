import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ReturnBarrels.css';

const ReturnBarrels = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Form, 2: Scan, 3: Confirmation
  const [formData, setFormData] = useState({
    reason: '',
    notes: '',
    numberOfBarrels: ''
  });
  const [scannedBarrels, setScannedBarrels] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasScanner, setHasScanner] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  // Auto-focus scan input when on step 2
  useEffect(() => {
    if (step === 2 && hasScanner) {
      document.getElementById('scanInput')?.focus();
    }
  }, [step, hasScanner]);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    // Auto-process on Enter or when scanner completes
    if (e.key === 'Enter' && value) {
      processBarrelScan(value);
      setScanInput('');
    }
  };

  // Process scanned barrel
  const processBarrelScan = (barrelId) => {
    if (!validateBarrelId(barrelId)) {
      showMessage('error', `Invalid barrel ID format: ${barrelId}. Use BHFP + 1-3 digits (e.g., BHFP1, BHFP12, BHFP123)`);
      return;
    }

    if (scannedBarrels.includes(barrelId)) {
      showMessage('warning', `Barrel ${barrelId} already scanned`);
      return;
    }

    if (formData.numberOfBarrels && scannedBarrels.length >= parseInt(formData.numberOfBarrels)) {
      showMessage('warning', `You've already scanned ${formData.numberOfBarrels} barrels`);
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

  // Proceed to scanning step
  const proceedToScan = () => {
    if (!formData.reason) {
      showMessage('error', 'Please select a reason for return');
      return;
    }

    if (!hasScanner && !formData.numberOfBarrels) {
      showMessage('error', 'Please enter number of barrels');
      return;
    }

    setStep(2);
  };

  // Request barrels from admin (no scanner)
  const requestBarrelsFromAdmin = async () => {
    if (!formData.numberOfBarrels || parseInt(formData.numberOfBarrels) < 1) {
      showMessage('error', 'Please enter a valid number of barrels');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/field-staff/request-barrel-ids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          numberOfBarrels: parseInt(formData.numberOfBarrels),
          reason: formData.reason,
          notes: formData.notes,
          requestedBy: user?._id,
          requestedByName: user?.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Request sent to admin successfully! You will be notified once barrel IDs are assigned.');
        setRequestSent(true);
        setTimeout(() => {
          // Reset form
          setFormData({ reason: '', notes: '', numberOfBarrels: '' });
          setStep(1);
          setRequestSent(false);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to send request');
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to send request to admin');
    } finally {
      setLoading(false);
    }
  };

  // Submit return request
  const submitReturnRequest = async () => {
    if (scannedBarrels.length === 0) {
      showMessage('error', 'Please scan at least one barrel');
      return;
    }

    if (formData.numberOfBarrels && scannedBarrels.length !== parseInt(formData.numberOfBarrels)) {
      showMessage('warning', `You specified ${formData.numberOfBarrels} barrels but scanned ${scannedBarrels.length}`);
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
          reason: formData.reason,
          notes: formData.notes,
          returnedBy: user?._id,
          returnedByName: user?.name,
          numberOfBarrels: scannedBarrels.length
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
        showMessage('success', `Successfully submitted ${scannedBarrels.length} barrels for return!`);
      } else {
        throw new Error(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  // Reset and start new return
  const startNewReturn = () => {
    setStep(1);
    setFormData({ reason: '', notes: '', numberOfBarrels: '' });
    setScannedBarrels([]);
    setScanInput('');
    setHasScanner(true);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="return-barrels-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <i className="fas fa-chevron-right"></i>
        <span>Dashboard</span>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : message.type === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="step-content">
          <div className="form-card">
            <h2><i className="fas fa-clipboard-list"></i> Return Details</h2>
            
            <div className="form-group">
              <label htmlFor="reason">Reason for Return *</label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleFormChange}
                className="form-control"
                required
              >
                <option value="">Select a reason...</option>
                <option value="completed_route">Completed Route</option>
                <option value="damaged_barrels">Damaged Barrels</option>
                <option value="excess_barrels">Excess Barrels</option>
                <option value="end_of_shift">End of Shift</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                className="form-control"
                rows="4"
                placeholder="Add any additional information about the return..."
              ></textarea>
            </div>

            <div className="scanner-check">
              <h3><i className="fas fa-qrcode"></i> Do you have a QR scanner?</h3>
              <div className="scanner-options">
                <button
                  className={`option-btn ${hasScanner ? 'active' : ''}`}
                  onClick={() => setHasScanner(true)}
                >
                  <i className="fas fa-check-circle"></i>
                  Yes, I have a scanner
                </button>
                <button
                  className={`option-btn ${!hasScanner ? 'active' : ''}`}
                  onClick={() => setHasScanner(false)}
                >
                  <i className="fas fa-times-circle"></i>
                  No scanner available
                </button>
              </div>
            </div>

            {!hasScanner && (
              <div className="no-scanner-section">
                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <p>Without a scanner, you'll need to request barrel IDs from the admin.</p>
                </div>
                <div className="form-group">
                  <label htmlFor="numberOfBarrels">Number of Barrels to Return *</label>
                  <input
                    type="number"
                    id="numberOfBarrels"
                    name="numberOfBarrels"
                    value={formData.numberOfBarrels}
                    onChange={handleFormChange}
                    className="form-control"
                    min="1"
                    max="100"
                    placeholder="Enter number of barrels"
                    required
                  />
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={requestBarrelsFromAdmin}
                  disabled={loading || requestSent}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending Request...
                    </>
                  ) : requestSent ? (
                    <>
                      <i className="fas fa-check"></i> Request Sent!
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Request Barrel IDs from Admin
                    </>
                  )}
                </button>
              </div>
            )}

            {hasScanner && (
              <div className="form-actions">
                <button
                  className="btn btn-primary btn-block"
                  onClick={proceedToScan}
                  disabled={!formData.reason}
                >
                  <i className="fas fa-arrow-right"></i> Proceed to Scanning
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Scan Barrels */}
      {step === 2 && (
        <div className="step-content">
          {/* Animated Header */}
          <div className="scan-header-animated">
            <div className="scan-circle">
              <div className="scan-pulse"></div>
              <i className="fas fa-qrcode"></i>
            </div>
            <div className="scan-progress-bar">
              <div 
                className="scan-progress-fill" 
                style={{ width: formData.numberOfBarrels ? `${(scannedBarrels.length / formData.numberOfBarrels) * 100}%` : '0%' }}
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
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="step-content">
          <div className="confirmation-card">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Return Request Submitted!</h2>
            <p className="success-message">
              Your return request for <strong>{scannedBarrels.length} barrels</strong> has been successfully submitted to the admin.
            </p>
            
            <div className="summary-box">
              <h3>Return Summary</h3>
              <div className="summary-row">
                <span className="label">Reason:</span>
                <span className="value">{formData.reason.replace(/_/g, ' ')}</span>
              </div>
              <div className="summary-row">
                <span className="label">Number of Barrels:</span>
                <span className="value">{scannedBarrels.length}</span>
              </div>
              <div className="summary-row">
                <span className="label">Submitted By:</span>
                <span className="value">{user?.name}</span>
              </div>
              <div className="summary-row">
                <span className="label">Date & Time:</span>
                <span className="value">{new Date().toLocaleString()}</span>
              </div>
              {formData.notes && (
                <div className="summary-row">
                  <span className="label">Notes:</span>
                  <span className="value">{formData.notes}</span>
                </div>
              )}
            </div>

            <div className="barrel-list-summary">
              <h4>Returned Barrel IDs:</h4>
              <div className="id-chips">
                {scannedBarrels.map(barrelId => (
                  <span key={barrelId} className="id-chip">{barrelId}</span>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={startNewReturn}
            >
              <i className="fas fa-plus"></i> Start New Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnBarrels;
