import React from 'react';
import { Link } from 'react-router-dom';

const Card = ({ title, desc, to, action = 'Open' }) => (
  <div className="card" style={{ borderRadius: 12 }}>
    <div className="card-body">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {desc ? <div style={{ color: '#a3a3a3', marginBottom: 12 }}>{desc}</div> : null}
      <Link className="btn btn-primary" to={to}>{action}</Link>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ margin: '0 0 12px 0' }}>{title}</h2>
    <div className="card-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {children}
    </div>
  </div>
);

const AdminHome = () => {
  return (
    <div>

      {/* Quick Action Button */}
      <div style={{ marginBottom: 24, textAlign: 'right' }}>
        <Link 
          to="/admin/staff-management" 
          className="btn btn-primary" 
          style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
          }}
        >
          <span>👥</span> Add Staff
        </Link>
      </div>

      {/* ADMIN CORE RESPONSIBILITIES */}
      <Section title="🏭 System Management">
        <Card 
          title="Barrel Management" 
          desc="Complete barrel lifecycle management system" 
          to="/admin/barrel-management" 
          action="Manage Barrels" 
        />
        <Card 
          title="User Management" 
          desc="Manage system users and roles" 
          to="/admin/users" 
          action="Manage Users" 
        />
        <Card 
          title="System Settings" 
          desc="Configure system parameters" 
          to="/admin/settings" 
          action="Settings" 
        />
        <Card 
          title="Reports & Analytics" 
          desc="View system reports and analytics" 
          to="/admin/reports" 
          action="View Reports" 
        />
      </Section>

      <Section title="📊 Operations">
        <Card 
          title="Staff Management" 
          desc="Manage staff and assignments" 
          to="/admin/staff-management" 
          action="Manage Staff" 
        />
        <Card 
          title="Performance Metrics" 
          desc="View performance metrics" 
          to="/admin/performance" 
          action="View Metrics" 
        />
        <Card 
          title="System Health" 
          desc="Monitor system health and status" 
          to="/admin/health" 
          action="Check Health" 
        />
      </Section>

      <Section title="🔄 Role Access">
        <Card 
          title="Manager Dashboard" 
          desc="Switch to Manager role view" 
          to="/manager/dashboard" 
          action="Manager View" 
        />
        <Card 
          title="System Overview" 
          desc="Complete system status overview" 
          to="/admin/overview" 
          action="System View" 
        />
      </Section>

      <Section title="Manager">
        <Card title="Create Barrel" desc="Create barrel IDs and print QR" to="/admin/create-barrel" action="Open" />
        <Card title="Approve Barrel" desc="Approve purchase by ID" to="/admin/create-barrel" action="Go" />
        <Card title="Barrel History" desc="View movement logs" to="/manager/barrel-history" action="View" />
        <Card title="Scan Barrel" desc="Scan and verify" to="/manager/barrel-scan" action="Scan" />
      </Section>

      <Section title="Staff Modules">
        <Card title="Staff Scan" desc="Field/Staff scanner" to="/staff/barrel-scan" action="Scan" />
        <Card title="Staff Barrel History" desc="Lookup movement logs" to="/staff/barrel-history" action="View" />
        <Card title="Delivery Scan" desc="Delivery staff scanning" to="/delivery/barrel-scan" action="Scan" />
        <Card title="Accountant Billing" desc="Payments and billing" to="/accountant/payments" action="Open" />
        <Card title="Lab DRC" desc="Enter/compute DRC" to="/lab/drc-update" action="Open" />
      </Section>
    </div>
  );
};

export default AdminHome;
