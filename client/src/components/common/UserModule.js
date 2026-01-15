import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserDisplay from './UserDisplay';
import LogoutButton from './LogoutButton';
import './UserModule.css';

const UserModule = ({ showIcons = true, showProfile = true, showLogout = true }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            navigate('/login');
        }
    };

    return (
        <div className="user-module">

            {/* Right: actions + profile */}
            <div className="user-module-right">
                {showIcons && (
                    <div className="user-module-icons">
                        <button className="icon-btn notification-btn" title="Notifications" onClick={() => navigate('/user/notifications')}>
                            <i className="fas fa-bell"></i>
                            <span className="notification-badge"></span>
                        </button>

                        {showLogout && (
                            <button className="icon-btn" title="Logout" onClick={handleLogout} style={{ color: '#ef4444' }}>
                                <i className="fas fa-power-off"></i>
                            </button>
                        )}
                    </div>
                )}

                {/* Profile Section */}
                {showProfile && (
                    <div className="user-module-profile">
                        <div className="profile-info" onClick={() => navigate('/user/profile/view')}>
                            <UserDisplay 
                                size="medium"
                                layout="horizontal"
                                showEmail={false}
                            />
                        </div>

                        <div className="profile-menu" ref={menuRef}>
                            <button
                                type="button"
                                className="profile-dropdown-btn"
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <i className="fas fa-ellipsis-v"></i>
                            </button>

                            {menuOpen && (
                                <div className="profile-dropdown">
                                    <NavLink
                                        to="/user/profile/view"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <i className="fas fa-eye"></i>
                                        <span>View Profile</span>
                                    </NavLink>

                                    <NavLink
                                        to="/user/profile"
                                        className="dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <i className="fas fa-pen"></i>
                                        <span>Edit Profile</span>
                                    </NavLink>

                                    {showLogout && (
                                        <div onClick={() => setMenuOpen(false)}>
                                            <LogoutButton 
                                                variant="minimal" 
                                                size="small"
                                                className="dropdown-item logout-item"
                                                style={{ 
                                                    justifyContent: 'flex-start',
                                                    width: '100%',
                                                    background: 'var(--role-primary, #3b82f6)',
                                                    color: 'white',
                                                    marginTop: '4px',
                                                    fontWeight: '600'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserModule;
