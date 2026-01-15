import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ManagerReturnBarrels.css';

const ManagerReturnBarrels = () => {
  const { user } = useAuth();
  const [returnedBarrels, setReturnedBarrels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('returnedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [formData, setFormData] = useState({
    barrelIds: '',
    returnedBy: '',
    returnReason: '',
    condition: 'good',
    notes: ''
  });

  const [reassignData, setReassignData] = useState({
    reassignTo: '',
    reassignReason: ''
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReturnedBarrels();
    fetchUsers();
  }, []);

  const fetchReturnedBarrels = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/api/barrels/returned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReturnedBarrels(Array.isArray(data) ? data : data.returnedBarrels || []);
      } else {
        setError('Failed to fetch returned barrels');
      }
    } catch (error) {
      console.error('Error fetching returned barrels:', error);
      setError('Failed to fetch returned barrels');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user-management/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    
    if (!formData.barrelIds || !formData.returnedBy) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const barrelIdsArray = formData.barrelIds.split(',').map(id => id.trim()).filter(id => id);
      
      const response = await fetch(`${API_BASE}/api/barrels/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          barrelIds: barrelIdsArray
        })
      });

      if (response.ok) {
        setMessage('Barrel return recorded successfully!');
        setShowCreateModal(false);
        setFormData({
          barrelIds: '',
          returnedBy: '',
          returnReason: '',
          condition: 'good',
          notes: ''
        });
        await fetchReturnedBarrels();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to record barrel return');
      }
    } catch (error) {
      console.error('Error creating return:', error);
      setError('Failed to record barrel return');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
    }
  };

  const handleUpdateReturn = async (e) => {
    e.preventDefault();
    
    if (!selectedReturn) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/barrels/returned/${selectedReturn._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Return updated successfully!');
        setShowEditModal(false);
        setSelectedReturn(null);
        await fetchReturnedBarrels();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update return');
      }
    } catch (error) {
      console.error('Error updating return:', error);
      setError('Failed to update return');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
    }
  };

  const handleDeleteReturn = async () => {
    if (!selectedReturn) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/barrels/returned/${selectedReturn._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('Return deleted successfully!');
        setShowDeleteModal(false);
        setSelectedReturn(null);
        await fetchReturnedBarrels();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to delete return');
      }
    } catch (error) {
      console.error('Error deleting return:', error);
      setError('Failed to delete return');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
    }
  };

  const handleReassign = async () => {
    if (!selectedReturn || !reassignData.reassignTo) {
      setError('Please select a user to reassign barrels to');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/barrels/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          returnId: selectedReturn._id,
          reassignTo: reassignData.reassignTo,
          reassignReason: reassignData.reassignReason
        })
      });

      if (response.ok) {
        setMessage('Barrels reassigned successfully!');
        setSelectedReturn(null);
        setReassignData({ reassignTo: '', reassignReason: '' });
        await fetchReturnedBarrels();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to reassign barrels');
      }
    } catch (error) {
      console.error('Error reassigning barrels:', error);
      setError('Failed to reassign barrels');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
    }
  };

  const openEditModal = (returnItem) => {
    setSelectedReturn(returnItem);
    setFormData({
      barrelIds: returnItem.barrels?.map(b => b.barrelId).join(', ') || '',
      returnedBy: returnItem.returnedBy?._id || '',
      returnReason: returnItem.returnReason || '',
      condition: returnItem.condition || 'good',
      notes: returnItem.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (returnItem) => {
    setSelectedReturn(returnItem);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'returned': { color: '#f59e0b', icon: 'fa-undo', label: 'Returned' },
      'reassigned': { color: '#3b82f6', icon: 'fa-exchange-alt', label: 'Reassigned' },
      'completed': { color: '#10b981', icon: 'fa-check-circle', label: 'Completed' },
      'pending': { color: '#ef4444', icon: 'fa-clock', label: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        <i className={`fas ${config.icon}`}></i>
        {config.label}
      </span>
    );
  };

  const getConditionBadge = (condition) => {
    const conditionConfig = {
      'excellent': { color: '#10b981', icon: 'fa-star' },
      'good': { color: '#3b82f6', icon: 'fa-thumbs-up' },
      'fair': { color: '#f59e0b', icon: 'fa-exclamation-triangle' },
      'poor': { color: '#ef4444', icon: 'fa-times-circle' },
      'damaged': { color: '#dc2626', icon: 'fa-exclamation-circle' }
    };
    
    const config = conditionConfig[condition] || conditionConfig['good'];
    
    return (
      <span 
        className="condition-badge"
        style={{ backgroundColor: config.color }}
      >
        <i className={`fas ${config.icon}`}></i>
        {condition?.charAt(0).toUpperCase() + condition?.slice(1)}
      </span>
    );
  };

  const filteredAndSortedReturns = returnedBarrels
    .filter(returnItem => {
      const matchesSearch = !searchTerm || 
        (returnItem.returnedBy?.name && returnItem.returnedBy.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (returnItem._id && returnItem._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (returnItem.barrels && returnItem.barrels.some(b => b.barrelId?.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'returnedBy') {
        aValue = a.returnedBy?.name || '';
        bValue = b.returnedBy?.name || '';
      }
      
      if (sortBy === 'barrelCount') {
        aValue = a.barrels?.length || 0;
        bValue = b.barrels?.length || 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const returnStats = {
    total: returnedBarrels.length,
    returned: returnedBarrels.filter(r => r.status === 'returned').length,
    reassigned: returnedBarrels.filter(r => r.status === 'reassigned').length,
    completed: returnedBarrels.filter(r => r.status === 'completed').length,
    totalBarrels: returnedBarrels.reduce((sum, r) => sum + (r.barrels?.length || 0), 0)
  };

  return (
    <div className="returned-barrels">
      {/* Header Section */}
      <div className="barrels-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <i className="fas fa-undo"></i>
              Returned Barrels Management
            </h1>
            <p>Track and manage returned barrels from staff members</p>
          </div>
          <div className="header-actions">
            <button
              className="create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus"></i>
              Record Return
            </button>
            <button
              className="refresh-btn"
              onClick={fetchReturnedBarrels}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'spinning' : ''}`}></i>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{returnStats.total}</div>
              <div className="stat-label">Total Returns</div>
            </div>
          </div>
          <div className="stat-card returned">
            <div className="stat-icon">
              <i className="fas fa-undo"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{returnStats.returned}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card reassigned">
            <div className="stat-icon">
              <i className="fas fa-exchange-alt"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{returnStats.reassigned}</div>
              <div className="stat-label">Reassigned</div>
            </div>
          </div>
          <div className="stat-card barrels">
            <div className="stat-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{returnStats.totalBarrels}</div>
              <div className="stat-label">Total Barrels</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by staff name, return ID, or barrel ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="returned">Returned</option>
            <option value="reassigned">Reassigned</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="returnedAt">Return Date</option>
            <option value="returnedBy">Staff Name</option>
            <option value="status">Status</option>
            <option value="barrelCount">Barrel Count</option>
          </select>
          
          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {message}
        </div>
      )}

      {/* Returns Container */}
      <div className="returns-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading returned barrels...</p>
          </div>
        ) : filteredAndSortedReturns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <h3>
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching returns found' 
                : 'No returned barrels'}
            </h3>
            <p>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Returned barrels will appear here when staff return them'}
            </p>
          </div>
        ) : (
          <div className="returns-grid">
            {filteredAndSortedReturns.map((returnItem) => (
              <div key={returnItem._id} className="return-card">
                <div className="return-header">
                  <div className="return-id">
                    <i className="fas fa-hashtag"></i>
                    Return #{returnItem._id?.slice(-6) || 'N/A'}
                  </div>
                  <div className="return-status">
                    {getStatusBadge(returnItem.status)}
                  </div>
                </div>

                <div className="return-staff">
                  <div className="staff-avatar">
                    {(returnItem.returnedBy?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="staff-details">
                    <h4>{returnItem.returnedBy?.name || 'Unknown Staff'}</h4>
                    <span className="staff-role">
                      {returnItem.returnedBy?.role?.replace('_', ' ') || 'Unknown Role'}
                    </span>
                  </div>
                </div>

                <div className="return-info">
                  <div className="info-item">
                    <i className="fas fa-calendar"></i>
                    <span className="info-label">Returned:</span>
                    <span className="info-value">{formatDate(returnItem.returnedAt)}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-boxes"></i>
                    <span className="info-label">Barrels:</span>
                    <span className="info-value">{returnItem.barrels?.length || 0}</span>
                  </div>
                  {returnItem.condition && (
                    <div className="info-item">
                      <i className="fas fa-clipboard-check"></i>
                      <span className="info-label">Condition:</span>
                      <span className="info-value">{getConditionBadge(returnItem.condition)}</span>
                    </div>
                  )}
                </div>

                {returnItem.barrels && returnItem.barrels.length > 0 && (
                  <div className="barrels-list">
                    <div className="barrels-header">
                      <i className="fas fa-list"></i>
                      <span>Barrel IDs</span>
                    </div>
                    <div className="barrel-ids">
                      {returnItem.barrels.slice(0, 3).map((barrel, index) => (
                        <span key={index} className="barrel-id">
                          {barrel.barrelId || barrel}
                        </span>
                      ))}
                      {returnItem.barrels.length > 3 && (
                        <span className="barrel-more">
                          +{returnItem.barrels.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {returnItem.returnReason && (
                  <div className="return-reason">
                    <div className="reason-header">
                      <i className="fas fa-comment-alt"></i>
                      <span>Return Reason</span>
                    </div>
                    <p>{returnItem.returnReason}</p>
                  </div>
                )}

                <div className="return-actions">
                  {returnItem.status === 'returned' && (
                    <button
                      className="action-btn reassign-btn"
                      onClick={() => {
                        setSelectedReturn(returnItem);
                        setReassignData({ reassignTo: '', reassignReason: '' });
                      }}
                    >
                      <i className="fas fa-exchange-alt"></i>
                      Reassign
                    </button>
                  )}
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEditModal(returnItem)}
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => openDeleteModal(returnItem)}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-plus"></i>
                Record Barrel Return
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateReturn} className="modal-body">
              <div className="form-group">
                <label htmlFor="barrelIds">
                  <i className="fas fa-boxes"></i>
                  Barrel IDs *
                </label>
                <input
                  type="text"
                  id="barrelIds"
                  value={formData.barrelIds}
                  onChange={(e) => setFormData(prev => ({ ...prev, barrelIds: e.target.value }))}
                  placeholder="Enter barrel IDs separated by commas"
                  required
                />
                <small>Separate multiple barrel IDs with commas</small>
              </div>

              <div className="form-group">
                <label htmlFor="returnedBy">
                  <i className="fas fa-user"></i>
                  Returned By *
                </label>
                <select
                  id="returnedBy"
                  value={formData.returnedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnedBy: e.target.value }))}
                  required
                >
                  <option value="">Select staff member</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="condition">
                    <i className="fas fa-clipboard-check"></i>
                    Condition
                  </label>
                  <select
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="returnReason">
                  <i className="fas fa-comment-alt"></i>
                  Return Reason
                </label>
                <textarea
                  id="returnReason"
                  value={formData.returnReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnReason: e.target.value }))}
                  placeholder="Enter reason for return..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  <i className="fas fa-sticky-note"></i>
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  <i className="fas fa-save"></i>
                  {loading ? 'Recording...' : 'Record Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReturn && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-edit"></i>
                Edit Return #{selectedReturn._id?.slice(-6)}
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleUpdateReturn} className="modal-body">
              <div className="form-group">
                <label htmlFor="editBarrelIds">
                  <i className="fas fa-boxes"></i>
                  Barrel IDs *
                </label>
                <input
                  type="text"
                  id="editBarrelIds"
                  value={formData.barrelIds}
                  onChange={(e) => setFormData(prev => ({ ...prev, barrelIds: e.target.value }))}
                  placeholder="Enter barrel IDs separated by commas"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editReturnedBy">
                  <i className="fas fa-user"></i>
                  Returned By *
                </label>
                <select
                  id="editReturnedBy"
                  value={formData.returnedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnedBy: e.target.value }))}
                  required
                >
                  <option value="">Select staff member</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editCondition">
                  <i className="fas fa-clipboard-check"></i>
                  Condition
                </label>
                <select
                  id="editCondition"
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editReturnReason">
                  <i className="fas fa-comment-alt"></i>
                  Return Reason
                </label>
                <textarea
                  id="editReturnReason"
                  value={formData.returnReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnReason: e.target.value }))}
                  placeholder="Enter reason for return..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="editNotes">
                  <i className="fas fa-sticky-note"></i>
                  Notes
                </label>
                <textarea
                  id="editNotes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  <i className="fas fa-save"></i>
                  {loading ? 'Updating...' : 'Update Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedReturn && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-exclamation-triangle"></i>
                Confirm Delete
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete this return record?</p>
              <div className="delete-info">
                <p><strong>Return ID:</strong> #{selectedReturn._id?.slice(-6)}</p>
                <p><strong>Returned By:</strong> {selectedReturn.returnedBy?.name}</p>
                <p><strong>Barrel Count:</strong> {selectedReturn.barrels?.length || 0}</p>
              </div>
              <p className="warning-text">
                <i className="fas fa-exclamation-triangle"></i>
                This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteReturn}
                disabled={loading}
              >
                <i className="fas fa-trash"></i>
                {loading ? 'Deleting...' : 'Delete Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {selectedReturn && !showEditModal && !showDeleteModal && !showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-exchange-alt"></i>
                Reassign Barrels
              </h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedReturn(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reassign-info">
                <div className="info-card">
                  <h4>Return Details</h4>
                  <p><strong>Return ID:</strong> #{selectedReturn._id?.slice(-6)}</p>
                  <p><strong>Barrel Count:</strong> {selectedReturn.barrels?.length || 0}</p>
                  <p><strong>Returned By:</strong> {selectedReturn.returnedBy?.name}</p>
                  <p><strong>Return Date:</strong> {formatDate(selectedReturn.returnedAt)}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reassignTo">
                  <i className="fas fa-user"></i>
                  Reassign To *
                </label>
                <select
                  id="reassignTo"
                  value={reassignData.reassignTo}
                  onChange={(e) => setReassignData(prev => ({
                    ...prev,
                    reassignTo: e.target.value
                  }))}
                  required
                >
                  <option value="">Select a staff member</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reassignReason">
                  <i className="fas fa-comment-alt"></i>
                  Reassignment Reason
                </label>
                <textarea
                  id="reassignReason"
                  value={reassignData.reassignReason}
                  onChange={(e) => setReassignData(prev => ({
                    ...prev,
                    reassignReason: e.target.value
                  }))}
                  placeholder="Enter reason for reassignment..."
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedReturn(null)}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className="submit-btn"
                onClick={handleReassign}
                disabled={loading || !reassignData.reassignTo}
              >
                <i className="fas fa-exchange-alt"></i>
                {loading ? 'Reassigning...' : 'Reassign Barrels'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReturnBarrels;
