import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './FieldStaffProfile.css';

const FieldStaffProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    staffId: '',
    address: '',
    emergencyContact: '',
    vehicleInfo: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        staffId: user.staffId || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        vehicleInfo: user.vehicleInfo || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/field-staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="field-staff-profile">
      <div className="profile-header">
        <h2>My Profile</h2>
        <div className="header-actions">
          {!isEditing ? (
            <button 
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <i className="fas fa-edit"></i>
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  // Reset to original values
                  if (user) {
                    setProfile({
                      name: user.name || '',
                      email: user.email || '',
                      phoneNumber: user.phoneNumber || '',
                      staffId: user.staffId || '',
                      address: user.address || '',
                      emergencyContact: user.emergencyContact || '',
                      vehicleInfo: user.vehicleInfo || ''
                    });
                  }
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <i className="fas fa-user"></i>
            </div>
            <div className="avatar-info">
              <h3>{profile.name || 'Field Staff Member'}</h3>
              <p>{profile.staffId || 'No Staff ID'}</p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Staff ID</label>
                  <input
                    type="text"
                    name="staffId"
                    value={profile.staffId}
                    onChange={handleInputChange}
                    disabled={true}
                    className="disabled"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profile.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Contact Information</h4>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={profile.emergencyContact}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                    placeholder="Emergency contact number"
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Information</label>
                  <input
                    type="text"
                    name="vehicleInfo"
                    value={profile.vehicleInfo}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                    placeholder="Vehicle details (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Account Status</h4>
              <div className="status-info">
                <div className="status-item">
                  <span className="status-label">Role:</span>
                  <span className="status-value">Field Staff</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className="status-value active">Active</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Joined:</span>
                  <span className="status-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldStaffProfile;