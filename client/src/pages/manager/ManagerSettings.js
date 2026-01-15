import React, { useState, useEffect } from 'react';
import './ManagerSettings.css';

const ManagerSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leaveNotifications: true,
    attendanceAlerts: true,
    stockAlerts: true,
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Kolkata',
  });

  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('managerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setMessage('');
    
    // Save to localStorage
    localStorage.setItem('managerSettings', JSON.stringify(settings));
    
    setTimeout(() => {
      setSaving(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  const handleReset = () => {
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      leaveNotifications: true,
      attendanceAlerts: true,
      stockAlerts: true,
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kolkata',
    };
    setSettings(defaultSettings);
    localStorage.setItem('managerSettings', JSON.stringify(defaultSettings));
    setMessage('Settings reset to default');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="manager-settings-container">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your preferences and notifications</p>
        </div>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            <i className="fas fa-undo" /> Reset to Default
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <i className="fas fa-save" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle" /> {message}
        </div>
      )}

      <div className="settings-content">
        {/* Notifications Section */}
        <div className="settings-section">
          <div className="section-header">
            <i className="fas fa-bell" />
            <div>
              <h2>Notifications</h2>
              <p>Configure how you receive notifications</p>
            </div>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Notifications</h3>
                <p>Receive notifications via email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Push Notifications</h3>
                <p>Receive push notifications in browser</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => handleToggle('pushNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Leave Request Alerts</h3>
                <p>Get notified when staff submit leave requests</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.leaveNotifications}
                  onChange={() => handleToggle('leaveNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Attendance Alerts</h3>
                <p>Receive alerts for attendance issues</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.attendanceAlerts}
                  onChange={() => handleToggle('attendanceAlerts')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Stock Alerts</h3>
                <p>Get notified about low stock levels</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.stockAlerts}
                  onChange={() => handleToggle('stockAlerts')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <div className="section-header">
            <i className="fas fa-palette" />
            <div>
              <h2>Appearance</h2>
              <p>Customize the look and feel</p>
            </div>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Theme</h3>
                <p>Choose your preferred theme</p>
              </div>
              <select 
                name="theme" 
                value={settings.theme} 
                onChange={handleChange}
                className="setting-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="settings-section">
          <div className="section-header">
            <i className="fas fa-globe" />
            <div>
              <h2>Regional Settings</h2>
              <p>Configure language and timezone</p>
            </div>
          </div>
          
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Language</h3>
                <p>Select your preferred language</p>
              </div>
              <select 
                name="language" 
                value={settings.language} 
                onChange={handleChange}
                className="setting-select"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Timezone</h3>
                <p>Set your local timezone</p>
              </div>
              <select 
                name="timezone" 
                value={settings.timezone} 
                onChange={handleChange}
                className="setting-select"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerSettings;
