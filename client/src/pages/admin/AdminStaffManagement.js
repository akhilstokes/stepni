import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiRefreshCw, FiSearch, FiMail, FiPhone, FiMapPin, FiUser } from 'react-icons/fi';
import './AdminStaffManagement.css';

const AdminStaffManagement = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Staff invitation form state
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Field Staff',
        staffId: ''
    });

    // Available roles
    const [roles] = useState([
        'Field Staff',
        'Lab Staff',
        'Delivery Staff',
        'Accountant',
        'Manager'
    ]);

    useEffect(() => {
        generateStaffId();
    }, [inviteForm.role]);

    const generateStaffId = () => {
        const rolePrefix = {
            'Field Staff': 'FS',
            'Lab Staff': 'LS',
            'Delivery Staff': 'DS',
            'Accountant': 'AC',
            'Manager': 'MG'
        };
        
        const prefix = rolePrefix[inviteForm.role] || 'ST';
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const staffId = `HFP${prefix}${randomNum}`;
        
        setInviteForm(prev => ({
            ...prev,
            staffId: staffId
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInviteForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendInvitation = async () => {
        try {
            // Validate required fields
            if (!inviteForm.name || !inviteForm.email || !inviteForm.phone) {
                setError('Please fill all required fields');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(inviteForm.email)) {
                setError('Please enter a valid email address');
                return;
            }

            setLoading(true);

            // Simulate API call
            setTimeout(() => {
                // Reset form
                setInviteForm({
                    name: '',
                    email: '',
                    phone: '',
                    role: 'Field Staff',
                    staffId: ''
                });
                
                setLoading(false);
                setSuccess('Staff invitation sent successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }, 1500);

        } catch (err) {
            setError('Failed to send invitation');
            setLoading(false);
        }
    };

    return (
        <div className="admin-staff-management">
            {/* Header */}
            <div className="staff-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <FiMail /> Send Staff Invitation
                    </h1>
                    <p className="page-description">
                        Fill in the staff details below to send an invitation email
                    </p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && <div className="alert-success">{success}</div>}
            {error && <div className="alert-error">{error}</div>}

            {/* Invitation Form */}
            <div className="invitation-card">
                <div className="invite-form-grid">
                    <div className="form-group">
                        <label className="form-label">
                            <FiUser className="label-icon" />
                            Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={inviteForm.name}
                            onChange={handleInputChange}
                            placeholder="Full Name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FiMail className="label-icon" />
                            Email <span className="required">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={inviteForm.email}
                            onChange={handleInputChange}
                            placeholder="staff@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FiPhone className="label-icon" />
                            Phone Number <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            value={inviteForm.phone}
                            onChange={handleInputChange}
                            placeholder="+919876543210"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FiUsers className="label-icon" />
                            Role <span className="required">*</span>
                        </label>
                        <select
                            name="role"
                            className="form-select"
                            value={inviteForm.role}
                            onChange={handleInputChange}
                            required
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group full-width">
                        <label className="form-label">
                            Staff ID (HFP01) <span className="required">*</span>
                        </label>
                        <div className="staff-id-group">
                            <input
                                type="text"
                                name="staffId"
                                className="form-input"
                                value={inviteForm.staffId}
                                readOnly
                            />
                            <button 
                                type="button"
                                className="generate-btn"
                                onClick={generateStaffId}
                            >
                                <FiRefreshCw /> Generate
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        className="send-invitation-btn"
                        onClick={handleSendInvitation}
                        disabled={loading}
                    >
                        {loading ? 'SENDING...' : 'SEND INVITATION'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminStaffManagement;