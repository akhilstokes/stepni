import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QRManagement.css';

const QRManagement = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const status = activeTab === 'pending' ? 'pending' : undefined;
      
      const response = await axios.get('/api/return-barrels/qr-requests', {
        headers: { Authorization: `Bearer ${token}` },
        params: status ? { status } : {}
      });

      if (activeTab === 'pending') {
        setPendingRequests(response.data.requests || []);
      } else {
        setAllRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Generate QR codes for this request?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/return-barrels/qr-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/return-barrels/qr-requests/${requestId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Request rejected');
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting request');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { class: 'priority-low', text: 'Low' },
      medium: { class: 'priority-medium', text: 'Medium' },
      high: { class: 'priority-high', text: 'High' },
      urgent: { class: 'priority-urgent', text: 'Urgent' }
    };
    return badges[priority] || badges.medium;
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

  const requests = activeTab === 'pending' ? pendingRequests : allRequests;

  return (
    <div className="qr-management-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-qrcode"></i>
          QR Code Management
        </h1>
        <p>Review and approve QR code requests</p>
      </div>

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

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <i className="fas fa-clock"></i>
          Pending ({pendingRequests.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="fas fa-list"></i>
          All Requests
        </button>
      </div>

      <div className="tab-content">
        {loading && requests.length === 0 ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <p>No {activeTab === 'pending' ? 'pending' : ''} requests</p>
          </div>
        ) : (
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Staff</th>
                  <th>Barrels</th>
                  <th>Reason</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const priorityBadge = getPriorityBadge(request.priority);
                  const statusBadge = getStatusBadge(request.status);
                  
                  return (
                    <tr key={request._id}>
                      <td className="request-number">{request.requestNumber}</td>
                      <td>
                        <div className="staff-info">
                          <div className="staff-name">{request.requestedBy?.name}</div>
                          <div className="staff-role">{request.requestedBy?.role}</div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="barrel-count">{request.numberOfBarrels}</span>
                      </td>
                      <td className="capitalize">{request.reason?.replace('_', ' ')}</td>
                      <td>
                        <span className={`priority-badge ${priorityBadge.class}`}>
                          {priorityBadge.text}
                        </span>
                      </td>
                      <td>{new Date(request.requestedDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${statusBadge.class}`}>
                          <i className={`fas ${statusBadge.icon}`}></i>
                          {statusBadge.text}
                        </span>
                      </td>
                      <td>
                        {request.status === 'pending' && (
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(request._id)}
                              disabled={loading}
                            >
                              <i className="fas fa-check"></i>
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => setSelectedRequest(request)}
                              disabled={loading}
                            >
                              <i className="fas fa-times"></i>
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status === 'completed' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <i className="fas fa-eye"></i>
                            View QRs
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedRequest && selectedRequest.status === 'pending' && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Request</h2>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Request: {selectedRequest.requestNumber}</p>
              <p>Staff: {selectedRequest.requestedBy?.name}</p>
              <p>Barrels: {selectedRequest.numberOfBarrels}</p>

              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  className="form-control"
                  placeholder="Explain why this request is being rejected..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedRequest._id)}
                  disabled={loading || !rejectionReason.trim()}
                >
                  {loading ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View QRs Modal */}
      {selectedRequest && selectedRequest.status === 'completed' && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generated QR Codes - {selectedRequest.requestNumber}</h2>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="qr-codes-grid">
                {selectedRequest.generatedQRs?.map((qr, index) => (
                  <div key={index} className="qr-code-card">
                    <img src={qr.qrCodeUrl} alt={qr.barrelId} />
                    <div className="qr-code-info">
                      <strong>{qr.barrelId}</strong>
                      <span className="qr-code-text">{qr.qrCode}</span>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default QRManagement;
