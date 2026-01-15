
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserModule from '../components/common/UserModule';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [notificationCount] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const menuRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/user') return 'Dashboard';
    if (path.startsWith('/user/profile')) return 'Profile';
    if (path.startsWith('/user/live-rate')) return 'Live Rate';
    if (path.startsWith('/user/transactions')) return 'Transactions';
    if (path.startsWith('/user/requests')) return 'Requests';
    if (path.startsWith('/user/notifications')) return 'Notifications';
    if (path.startsWith('/user/my-actions')) return 'My Actions';
    return 'Dashboard';
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // Menu close logic can be added here if needed
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  const getInitials = (name) => {
    if (!name) return 'AN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="web-dashboard">
      {/* Web Sidebar */}
      <div className={`web-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="web-header">
          <div className="header-content">
            <div className="brand-info">
              <div className="brand-icon">
                <i className="fas fa-industry"></i>
              </div>
              <div className="brand-text">
                <h3>HFP Portal</h3>
                <span>Customer Dashboard</span>
              </div>
            </div>
            <div className="header-controls">
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="nav-sections">
          {/* Dashboard Section */}
          <div className="nav-section">
            <h4 className="section-title">DASHBOARD</h4>
            <div className="nav-items">
              <NavLink to="/user" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-home"></i>
                  </div>
                </div>
                <span className="nav-label">Overview</span>
              </NavLink>
              
              <NavLink to="/user/my-actions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-tasks"></i>
                  </div>
                </div>
                <span className="nav-label">My Actions</span>
              </NavLink>

              <NavLink to="/user/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-user"></i>
                  </div>
                </div>
                <span className="nav-label">Profile</span>
              </NavLink>

              <NavLink to="/user/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-bell"></i>
                  </div>
                </div>
                <span className="nav-label">Notifications</span>
              </NavLink>
            </div>
          </div>

          <div className="nav-section">
            <h4 className="section-title">ACTIONS</h4>
            <div className="nav-items">
              <NavLink to="/user/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-truck-loading"></i>
                  </div>
                </div>
                <span className="nav-label">Sell Barrel Request</span>
              </NavLink>

              <NavLink to="/user/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-box-open"></i>
                  </div>
                </div>
                <span className="nav-label">Request Barrels</span>
              </NavLink>

              <NavLink to="/user/live-rate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                </div>
                <span className="nav-label">View Live Rate</span>
              </NavLink>

              <NavLink to="/user/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <i className="fas fa-receipt"></i>
                  </div>
                </div>
                <span className="nav-label">View Transactions</span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sign-out-btn">
            <div className="sign-out-icon">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation Bar */}
        <div className="top-nav-bar">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-brand">
              <div className="topbar-brand-title">HFP Portal</div>
              <div className="topbar-brand-sub">Customer Dashboard</div>
            </div>
            <div className="topbar-divider"></div>
            <div className="topbar-page">{getPageTitle()}</div>
          </div>
          
          <div className="header-actions">
            <button className="notification-btn" onClick={() => navigate('/user/notifications')}>
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <div className="notification-badge">{notificationCount}</div>
              )}
            </button>
            
            <div className="profile-dropdown">
              <button className="profile-btn" onClick={() => navigate('/user/profile')}>
                <div className="profile-avatar">
                  <span>{getInitials(user?.name)}</span>
                </div>
                <div className="profile-info">
                  <div className="profile-name">{user?.name || 'User'}</div>
                  <div className="profile-role">{user?.role || 'Customer'}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
