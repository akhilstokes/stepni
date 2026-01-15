
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './StaffDashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const StaffDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationCount] = useState(1);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };


  const navigationItems = [
    { path: '/staff/attendance', icon: 'fas fa-user-clock', label: 'Attendance' },
    { path: '/staff/schedule', icon: 'fas fa-calendar-alt', label: 'My Schedule' },
    { path: '/staff/leave', icon: 'fas fa-calendar-days', label: 'Apply Leave' },
    { path: '/staff/salary', icon: 'fas fa-wallet', label: 'Salary Details' },
    { path: '/staff/issues', icon: 'fas fa-exclamation-circle', label: 'Raise Issue' },
    { path: '/staff/return-barrels', icon: 'fas fa-undo', label: 'Return Barrel' },
    // Field staff specific items
    ...(user?.role === 'field_staff' ? [
      { path: '/field-staff/routes', icon: 'fas fa-route', label: 'My Routes' },
      { path: '/field-staff/reports', icon: 'fas fa-file-alt', label: 'Daily Reports' }
    ] : [])
  ];

  return (
    <div className="staff-dashboard">
      {/* Sidebar */}
      <aside className={`staff-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-section">
            <div className="brand-icon">
              <i className="fas fa-users"></i>
            </div>
            {!sidebarCollapsed && (
              <div className="brand-text">
                <h3>Staff Panel</h3>
                <span>Dashboard</span>
              </div>
            )}
          </div>
          <div className="header-controls">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <div className="section-title">Main Menu</div>}
            <ul className="nav-list">
              {navigationItems.map((item, index) => (
                <li key={index} className="nav-item">
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <div className="nav-icon">
                      <i className={item.icon}></i>
                    </div>
                    {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">Staff Dashboard</h1>
            <div className="breadcrumb">
              <span>Home</span>
              <i className="fas fa-chevron-right"></i>
              <span>Dashboard</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button className="notification-btn" title="Notifications">
                <i className="fas fa-bell"></i>
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>
              
              <div className="profile-dropdown-container" ref={menuRef}>
                <button 
                  className="profile-btn" 
                  onClick={() => setMenuOpen(!menuOpen)}
                  title="Profile Menu"
                >
                  <div className="profile-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">{user?.name || 'Staff'}</span>
                    <span className="profile-role">{user?.role?.replace('_', ' ') || 'Staff'}</span>
                  </div>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {menuOpen && (
                  <div className="profile-dropdown">
                    <NavLink 
                      to="/staff/profile" 
                      className="dropdown-item" 
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fas fa-user"></i>
                      <span>My Profile</span>
                    </NavLink>
                    <NavLink 
                      to="/staff/settings" 
                      className="dropdown-item" 
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fas fa-cog"></i>
                      <span>Settings</span>
                    </NavLink>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;






