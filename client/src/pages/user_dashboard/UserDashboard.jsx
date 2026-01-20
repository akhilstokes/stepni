import React from 'react';
import { NavLink } from 'react-router-dom';
import './userDashboardTheme.css';

const UserDashboard = () => {
  return (
    <div className="user-dashboard">
      <div className="userdash-header">
        <div className="userdash-title">
          <h2>Customer Dashboard</h2>
          <p>Manage your profile, view rates, track transactions, and raise requests.</p>
        </div>
      </div>

      <div className="userdash-stats">
        <div className="userdash-stat">
          <div className="userdash-stat-icon">
            <i className="fas fa-wallet"></i>
          </div>
          <div className="userdash-stat-body">
            <div className="userdash-stat-label">Transactions</div>
            <div className="userdash-stat-value">View History</div>
          </div>
        </div>
        <div className="userdash-stat">
          <div className="userdash-stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="userdash-stat-body">
            <div className="userdash-stat-label">Live Rate</div>
            <div className="userdash-stat-value">Today’s Updates</div>
          </div>
        </div>
        <div className="userdash-stat">
          <div className="userdash-stat-icon">
            <i className="fas fa-bell"></i>
          </div>
          <div className="userdash-stat-body">
            <div className="userdash-stat-label">Notifications</div>
            <div className="userdash-stat-value">Latest Alerts</div>
          </div>
        </div>
      </div>

      <div className="userdash-grid">
        <NavLink className="userdash-card" to="/user/profile">
          <div className="userdash-card-icon">
            <i className="fas fa-user"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Profile</div>
            <div className="userdash-card-desc">View and update your profile details.</div>
          </div>
          <div className="userdash-card-cta">
            <span>Open</span>
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/live-rate">
          <div className="userdash-card-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Live Rate</div>
            <div className="userdash-card-desc">Check current market rate and history.</div>
          </div>
          <div className="userdash-card-cta">
            <span>Open</span>
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/transactions">
          <div className="userdash-card-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Transactions & Bills</div>
            <div className="userdash-card-desc">Browse past transactions and download bills.</div>
          </div>
          <div className="userdash-card-cta">
            <span>Open</span>
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/requests">
          <div className="userdash-card-icon">
            <i className="fas fa-headset"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Requests & Complaints</div>
            <div className="userdash-card-desc">Request barrels or log an issue.</div>
          </div>
          <div className="userdash-card-cta">
            <span>Open</span>
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/notifications">
          <div className="userdash-card-icon">
            <i className="fas fa-bell"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Notifications</div>
            <div className="userdash-card-desc">See recent alerts and updates.</div>
          </div>
          <div className="userdash-card-cta">
            <span>Open</span>
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default UserDashboard;
