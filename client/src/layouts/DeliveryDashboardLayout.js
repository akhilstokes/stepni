import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './DeliveryDashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const DeliveryDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickStats, setQuickStats] = useState({
    pending: 0,
    completed: 0,
    earnings: 0
  });
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try { 
      await logout(); 
    } finally { 
      navigate('/login'); 
    }
  };

  useEffect(() => {
    const handler = (e) => { 
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false); 
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  useEffect(() => {
    fetchQuickStats();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/delivery/quick-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuickStats(data);
      } else {
        // Show zero stats when API is not available
        setQuickStats({
          pending: 0,
          completed: 0,
          earnings: 0
        });
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      // Show zero stats when API fails
      setQuickStats({
        pending: 0,
        completed: 0,
        earnings: 0
      });
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/delivery') return { title: 'Dashboard', subtitle: 'Overview of your delivery activities', icon: 'fa-home' };
    if (path.includes('/route-plan')) return { title: 'Route Plan', subtitle: 'Plan your delivery routes', icon: 'fa-map' };
    if (path.includes('/tasks')) return { title: 'My Tasks', subtitle: 'View and manage your tasks', icon: 'fa-tasks' };
    if (path.includes('/assigned-requests')) return { title: 'Assigned Requests', subtitle: 'Handle assigned delivery requests', icon: 'fa-list' };
    if (path.includes('/task-history')) return { title: 'Task History', subtitle: 'View completed tasks', icon: 'fa-history' };
    if (path.includes('/shift-schedule')) return { title: 'My Schedule', subtitle: 'View your work schedule', icon: 'fa-calendar' };
    if (path.includes('/vehicle-info')) return { title: 'Vehicle Details', subtitle: 'Manage your vehicle information', icon: 'fa-car' };
    if (path.includes('/barrel-intake')) return { title: 'Barrel Intake', subtitle: 'Manage barrel intake process', icon: 'fa-box' };
    if (path.includes('/leave')) return { title: 'Leave Management', subtitle: 'Apply and manage leave', icon: 'fa-calendar-times' };
    if (path.includes('/salary')) return { title: 'My Salary', subtitle: 'View salary information', icon: 'fa-money-bill' };
    return { title: 'Delivery', subtitle: 'Delivery management system', icon: 'fa-truck' };
  };

  const pageInfo = getPageTitle();

  const notificationCount = Number(quickStats?.pending) || 0;

  const navigationItems = [
    {
      section: 'Main',
      items: [
        { to: '/delivery', icon: 'fa-home', label: 'Dashboard' },
        { to: '/delivery/route-plan', icon: 'fa-map', label: 'Route Plan' },
        { to: '/delivery/tasks', icon: 'fa-tasks', label: 'My Tasks' },
        { to: '/delivery/barrel-deliveries', icon: 'fa-truck', label: 'Barrel Deliveries' },
      ]
    },
    {
      section: 'Operations',
      items: [
        { to: '/delivery/assigned-requests', icon: 'fa-list', label: 'Assigned Requests' },
        { to: '/delivery/task-history', icon: 'fa-history', label: 'Task History' },
      ]
    },
    {
      section: 'Personal',
      items: [
        { to: '/delivery/shift-schedule', icon: 'fa-calendar', label: 'My Schedule' },
        { to: '/delivery/vehicle-info', icon: 'fa-car', label: 'Vehicle Details' },
        { to: '/delivery/leave', icon: 'fa-calendar-times', label: 'Leave' },
        { to: '/delivery/salary', icon: 'fa-money-bill', label: 'My Salary' },
      ]
    }
  ];

  return (
    <div className="delivery-dashboard-container">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`delivery-sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`delivery-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${!sidebarOpen ? 'hidden' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="delivery-sidebar-header">
          <div className="delivery-brand">
            <div className="delivery-brand-icon">
              <i className="fas fa-truck"></i>
            </div>
            <div className="delivery-brand-text">
              <h3>HFP Delivery</h3>
              <span>Staff Portal</span>
            </div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="delivery-user-card">
          <div className="delivery-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="delivery-user-info">
            <div className="delivery-user-greeting">Good day,</div>
            <div className="delivery-user-name">{user?.name || user?.email || 'User'}</div>
            <div className="delivery-user-role">Delivery Staff</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="delivery-nav">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="delivery-nav-section">
              <div className="delivery-nav-title">{section.section}</div>
              <div className="delivery-nav-items">
                {section.items.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.to}
                    className={({ isActive }) => 
                      `delivery-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="delivery-nav-icon">
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span className="delivery-nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="delivery-nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="delivery-sidebar-footer">
          <button className="delivery-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`delivery-main-content ${sidebarCollapsed ? 'expanded' : ''} ${!sidebarOpen ? 'full-width' : ''}`}>
        {/* Top Header */}
        <header className="delivery-top-header">
          <div className="delivery-header-left">
            <button 
              className="delivery-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            
            <div className="delivery-page-title">
              <div className="delivery-page-icon">
                <i className={`fas ${pageInfo.icon}`}></i>
              </div>
              <div className="delivery-page-info">
                <h1>{pageInfo.title}</h1>
                <p>{pageInfo.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="delivery-header-right">
            {/* Quick Stats */}
            <div className="delivery-quick-stats">
              <div className="delivery-stat-item">
                <div className="delivery-stat-icon pending">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="delivery-stat-content">
                  <div className="delivery-stat-number">{quickStats.pending}</div>
                  <div className="delivery-stat-label">Pending</div>
                </div>
              </div>
              <div className="delivery-stat-item">
                <div className="delivery-stat-icon completed">
                  <i className="fas fa-check"></i>
                </div>
                <div className="delivery-stat-content">
                  <div className="delivery-stat-number">{quickStats.completed}</div>
                  <div className="delivery-stat-label">Completed</div>
                </div>
              </div>
              <div className="delivery-stat-item">
                <div className="delivery-stat-icon earnings">
                  <i className="fas fa-rupee-sign"></i>
                </div>
                <div className="delivery-stat-content">
                  <div className="delivery-stat-number">₹{quickStats.earnings}</div>
                  <div className="delivery-stat-label">Today</div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <button
              className="delivery-notification-btn"
              onClick={() => navigate('/delivery/tasks')}
              aria-label="Notifications"
              type="button"
            >
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <div className="delivery-notification-dot">{notificationCount}</div>
              )}
            </button>

            {/* Profile Icon */}
            <button
              className="delivery-profile-icon-btn"
              onClick={() => navigate('/delivery/profile')}
              aria-label="Profile"
              type="button"
            >
              <i className="fas fa-user-circle"></i>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="delivery-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DeliveryDashboardLayout;
