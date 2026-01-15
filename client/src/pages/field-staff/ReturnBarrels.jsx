import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BarrelQRScanner from '../../components/workflows/BarrelQRScanner';
import './ReturnBarrels.css';

const ReturnBarrels = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [scannedBarrel, setScannedBarrel] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [hangerSpaces, setHangerSpaces] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showHangerForm, setShowHangerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request form state
  const [requestForm, setRequestForm] = useState({
    numberOfBarrels: 1,
    reason: 'qr_missing',
    notes: '',
    priority: 'medium'
  });

  // Hanger form state
  const [hangerForm, setHangerForm] = useState({
    barrelId: '',
    hangerSpaceId: '',
    slotNumber: ''
  });

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchMyRequests();
    } else if (activeTab === 'hanger') {
      fetchHangerSpaces();
    }
  }, [activeTab]);

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/return-barrels/my-qr-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const fetchHangerSpaces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/return-barrels/hanger-spaces', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHangerSpaces(response.data.hangerSpaces || []);
    } catch (err) {
      console.error('Error fetching hanger spaces:', err);
    }
  };

  const handleQRScan = async (qrCode) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/return-barrels/scan-qr',
        { qrCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScannedBarrel(response.data.barrel);
      setSuccess('Barrel scanned and marked as returned successfully!');
      
      // Auto-fill hanger form
      setHangerForm(prev => ({
        ...prev,
        barrelId: response.data.barrel.barrelId
      }));

    } catch (err) {
      if (err.response?.data?.qrMissing) {
        setError('QR code not found. Please request a new QR code.');
        setShowRequestForm(true);
      } else {
        setError(err.response?.data?.message || 'Error scanning barrel');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/return-barrels/request-qr',
        requestForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('QR request submitted successfully! Admin will review it.');
      setShowRequestForm(false);
      setRequestForm({
        numberOfBarrels: 1,
        reason: 'qr_missing',
        notes: '',
        priority: 'medium'
      });
      
      // Refresh requests
      fetchMyRequests();
      setActiveTab('requests');

    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttachment = async (qrCode, requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/return-barrels/confirm-qr-attachment',
        { qrCode, requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('QR attachment confirmed!');
      fetchMyRequests();

    } catch (err) {
      setError(err.response?.data?.message || 'Error confirming attachment');
    }
  };

  const handleAddToHanger = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/return-barrels/add-to-hanger',
        hangerForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Barrel added to hanger space successfully!');
      setShowHangerForm(false);
      setHangerForm({
        barrelId: '',
        hangerSpaceId: '',
        slotNumber: ''
      });
      setScannedBarrel(null);

    } catch (err) {
      setError(err.response?.data?.message || 'Error adding to hanger');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', text: 'Pending', icon: 'fa-clock' },
      approved: { class: 'status-approved', text: 'Approved', icon: 'fa-check' },
      rejected: { class: 'status-rejected', text: 'Rejected', icon: 'fa-times' },
      completed: { class: 'status-completed', text: 'Completed', icon: 'fa-check-double' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="return-barrels-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-undo-alt"></i>
          Return Barrels
        </h1>
        <p>Scan QR codes and manage barrel returns</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          <i className="fas fa-qrcode"></i>
          Scan QR
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <i className="fas fa-list"></i>
          My Requests
        </button>
        <button
          className={`tab ${activeTab === 'hanger' ? 'active' : ''}`}
          onClick={() => setActiveTab('hanger')}
        >
          <i className="fas fa-warehouse"></i>
          Add to Hanger
        </button>
      </div>

      {/* Scan QR Tab */}
      {activeTab === 'scan' && (
        <div className="tab-content">
          <div className="scan-section">
            <BarrelQRScanner onScan={handleQRScan} />

            {scannedBarrel && (
              <div className="scanned-barrel-info">
                <h3>
                  <i className="fas fa-check-circle"></i>
                  Barrel Scanned Successfully
                </h3>
                <div className="barrel-details">
                  <div className="detail-row">
                    <span className="label">Barrel ID:</span>
                    <span className="value">{scannedBarrel.barrelId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">QR Code:</span>
                    <span className="value">{scannedBarrel.qrCode}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className="value status-badge status-success">
                      {scannedBarrel.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Returned Date:</span>
                    <span className="value">
                      {new Date(scannedBarrel.returnedDate).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveTab('hanger');
                    setShowHangerForm(true);
                  }}
                >
                  <i className="fas fa-arrow-right"></i>
                  Add to Hanger Space
                </button>
              </div>
            )}

            <div className="qr-missing-section">
              <h3>QR Code Missing or Damaged?</h3>
              <p>If the barrel's QR code is not readable, request a new one.</p>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRequestForm(true)}
              >
                <i className="fas fa-plus"></i>
                Request New QR Code
              </button>
            </div>
          </div>

          {/* Request Form Modal */}
          {showRequestForm && (
            <div className="modal-overlay" onClick={() => setShowRequestForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Request New QR Codes</h2>
                  <button
                    className="close-btn"
                    onClick={() => setShowRequestForm(false)}
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleRequestSubmit} className="modal-body">
                  <div className="form-group">
                    <label>Number of Barrels *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={requestForm.numberOfBarrels}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, numberOfBarrels: parseInt(e.target.value) })
                      }
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Reason *</label>
                    <select
                      value={requestForm.reason}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, reason: e.target.value })
                      }
                      required
                      className="form-control"
                    >
                      <option value="qr_missing">QR Missing</option>
                      <option value="qr_damaged">QR Damaged</option>
                      <option value="qr_unreadable">QR Unreadable</option>
                      <option value="new_barrel">New Barrel</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={requestForm.priority}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, priority: e.target.value })
                      }
                      className="form-control"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={requestForm.notes}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, notes: e.target.value })
                      }
                      rows="3"
                      className="form-control"
                      placeholder="Additional details..."
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="btn btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Requests Tab */}
      {activeTab === 'requests' && (
        <div className="tab-content">
          <div className="requests-section">
            <div className="section-header">
              <h2>My QR Requests</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowRequestForm(true)}
              >
                <i className="fas fa-plus"></i>
                New Request
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No requests yet</p>
              </div>
            ) : (
              <div className="requests-grid">
                {myRequests.map((request) => {
                  const badge = getStatusBadge(request.status);
                  return (
                    <div key={request._id} className="request-card">
                      <div className="request-header">
                        <span className="request-number">{request.requestNumber}</span>
                        <span className={`status-badge ${badge.class}`}>
                          <i className={`fas ${badge.icon}`}></i>
                          {badge.text}
                        </span>
                      </div>

                      <div className="request-body">
                        <div className="request-detail">
                          <i className="fas fa-boxes"></i>
                          <span>{request.numberOfBarrels} Barrels</span>
                        </div>
                        <div className="request-detail">
                          <i className="fas fa-calendar"></i>
                          <span>
                            {new Date(request.requestedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="request-detail">
                          <i className="fas fa-exclamation-circle"></i>
                          <span className="capitalize">{request.reason.replace('_', ' ')}</span>
                        </div>
                        {request.priority && (
                          <div className="request-detail">
                            <i className="fas fa-flag"></i>
                            <span className={`priority-${request.priority}`}>
                              {request.priority}
                            </span>
                          </div>
                        )}
                      </div>

                      {request.status === 'completed' && request.generatedQRs && (
                        <div className="generated-qrs">
                          <h4>Generated QR Codes:</h4>
                          <div className="qr-list">
                            {request.generatedQRs.map((qr, index) => (
                              <div key={index} className="qr-item">
                                <img src={qr.qrCodeUrl} alt={qr.barrelId} />
                                <div className="qr-info">
                                  <span className="barrel-id">{qr.barrelId}</span>
                                  {!qr.attached && (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() =>
                                        handleConfirmAttachment(qr.qrCode, request._id)
                                      }
                                    >
                                      Confirm Attached
                                    </button>
                                  )}
                                  {qr.attached && (
                                    <span className="attached-badge">
                                      <i className="fas fa-check"></i>
                                      Attached
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="rejection-reason">
                          <strong>Rejection Reason:</strong>
                          <p>{request.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Hanger Tab */}
      {activeTab === 'hanger' && (
        <div className="tab-content">
          <div className="hanger-section">
            <h2>Add Barrel to Hanger Space</h2>

            <form onSubmit={handleAddToHanger} className="hanger-form">
              <div className="form-group">
                <label>Barrel ID *</label>
                <input
                  type="text"
                  value={hangerForm.barrelId}
                  onChange={(e) =>
                    setHangerForm({ ...hangerForm, barrelId: e.target.value })
                  }
                  required
                  className="form-control"
                  placeholder="Enter barrel ID or scan QR"
                />
              </div>

              <div className="form-group">
                <label>Hanger Space *</label>
                <select
                  value={hangerForm.hangerSpaceId}
                  onChange={(e) => {
                    setHangerForm({ ...hangerForm, hangerSpaceId: e.target.value, slotNumber: '' });
                  }}
                  required
                  className="form-control"
                >
                  <option value="">-- Select Hanger Space --</option>
                  {hangerSpaces.map((space) => (
                    <option key={space._id} value={space._id}>
                      {space.location} ({space.availableSlots} available)
                    </option>
                  ))}
                </select>
              </div>

              {hangerForm.hangerSpaceId && (
                <div className="form-group">
                  <label>Slot Number *</label>
                  <select
                    value={hangerForm.slotNumber}
                    onChange={(e) =>
                      setHangerForm({ ...hangerForm, slotNumber: e.target.value })
                    }
                    required
                    className="form-control"
                  >
                    <option value="">-- Select Slot --</option>
                    {hangerSpaces
                      .find((s) => s._id === hangerForm.hangerSpaceId)
                      ?.slots.filter((slot) => !slot.isOccupied)
                      .map((slot) => (
                        <option key={slot.slotNumber} value={slot.slotNumber}>
                          Slot {slot.slotNumber}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add to Hanger Space'}
              </button>
            </form>

            {/* Hanger Spaces Overview */}
            <div className="hanger-spaces-overview">
              <h3>Available Hanger Spaces</h3>
              <div className="hanger-grid">
                {hangerSpaces.map((space) => (
                  <div key={space._id} className="hanger-card">
                    <h4>{space.location}</h4>
                    <div className="hanger-stats">
                      <div className="stat">
                        <span className="stat-value">{space.totalSlots}</span>
                        <span className="stat-label">Total Slots</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{space.occupiedSlots}</span>
                        <span className="stat-label">Occupied</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{space.availableSlots}</span>
                        <span className="stat-label">Available</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnBarrels;
