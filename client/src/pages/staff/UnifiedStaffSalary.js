import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './UnifiedStaffSalary.css';

const UnifiedStaffSalary = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('current');
  const [salaryData, setSalaryData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salaryTableData, setSalaryTableData] = useState([]);

  // Determine salary type based on user role
  const getSalaryType = (role) => {
    switch (role) {
      case 'delivery_staff':
        return 'daily';
      case 'field_staff':
        return 'daily';
      case 'lab':
      case 'lab_staff':
      case 'lab_manager':
        return 'monthly';
      default:
        return 'monthly';
    }
  };

  const getSalaryViewTitle = (role) => {
    switch (role) {
      case 'delivery_staff':
        return 'Daily Wage System';
      case 'field_staff':
        return 'Daily Wage System';
      case 'lab':
      case 'lab_staff':
      case 'lab_manager':
        return 'Monthly Salary System';
      default:
        return 'Salary System';
    }
  };

  const salaryType = getSalaryType(user?.role);
  const viewTitle = getSalaryViewTitle(user?.role);

  // Load salary data
  useEffect(() => {
    const loadSalaryData = async () => {
      if (!user?._id) return;
      
      setLoading(true);
      try {
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        // Load current salary data
        const currentResponse = await fetch(`${base}/api/salary/current/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setSalaryData(currentData);
        }

        // Load salary history
        const historyResponse = await fetch(`${base}/api/salary/history/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistory(historyData.data || []);
        }

        // Load salary table data
        const tableResponse = await fetch(`${base}/api/salary/table/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (tableResponse.ok) {
          const tableData = await tableResponse.json();
          setSalaryTableData(tableData.data || []);
        }
      } catch (error) {
        console.error('Error loading salary data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalaryData();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading salary information...</p>
      </div>
    );
  }

  return (
    <div className="unified-salary-container">
      <div className="salary-card-wrapper">
        <div className="salary-main-card">
          <div className="salary-header">
            <h3>{viewTitle}</h3>
            <div className="view-toggle-group">
              <button
                className={`view-toggle-btn ${activeView === 'current' ? 'active' : ''}`}
                onClick={() => setActiveView('current')}
              >
                Current Period
              </button>
              <button
                className={`view-toggle-btn ${activeView === 'table' ? 'active' : ''}`}
                onClick={() => setActiveView('table')}
              >
                Salary Table
              </button>
              <button
                className={`view-toggle-btn ${activeView === 'history' ? 'active' : ''}`}
                onClick={() => setActiveView('history')}
              >
                History
              </button>
            </div>
          </div>

          <div className="salary-content">
            {activeView === 'current' && (
              <div className="current-salary-view">
                {salaryData ? (
                  <div className="salary-details">
                    <div className="salary-summary">
                      <div className="salary-item">
                        <label>Basic Salary:</label>
                        <span>₹{salaryData.basicSalary || 0}</span>
                      </div>
                      <div className="salary-item">
                        <label>Gross Salary:</label>
                        <span>₹{salaryData.grossSalary || 0}</span>
                      </div>
                      <div className="salary-item">
                        <label>Net Salary:</label>
                        <span>₹{salaryData.netSalary || 0}</span>
                      </div>
                      <div className="salary-item">
                        <label>Status:</label>
                        <span className={`status ${salaryData.status}`}>
                          {salaryData.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    {salaryType === 'daily' && (
                      <div className="daily-wage-info">
                        <h4>Daily Wage Information</h4>
                        <div className="wage-details">
                          <div className="wage-item">
                            <label>Daily Rate:</label>
                            <span>₹{salaryData.dailyRate || 0}</span>
                          </div>
                          <div className="wage-item">
                            <label>Days Worked:</label>
                            <span>{salaryData.daysWorked || 0}</span>
                          </div>
                          <div className="wage-item">
                            <label>Total Earnings:</label>
                            <span>₹{(salaryData.dailyRate || 0) * (salaryData.daysWorked || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-salary-data">
                    <p>No salary data available for the current period.</p>
                    <p>Please contact your manager for more information.</p>
                  </div>
                )}
              </div>
            )}

            {activeView === 'table' && (
              <div className="salary-table-view">
                <h4>Salary Structure</h4>
                {salaryTableData.length > 0 ? (
                  <div className="table-responsive">
                    <table className="salary-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Basic</th>
                          <th>Allowances</th>
                          <th>Deductions</th>
                          <th>Net Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryTableData.map((item, index) => (
                          <tr key={index}>
                            <td>{item.period}</td>
                            <td>₹{item.basic || 0}</td>
                            <td>₹{item.allowances || 0}</td>
                            <td>₹{item.deductions || 0}</td>
                            <td>₹{item.netAmount || 0}</td>
                            <td>
                              <span className={`status ${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-table-data">
                    <p>No salary table data available.</p>
                    <p>Salary structure will be updated by management.</p>
                  </div>
                )}
              </div>
            )}

            {activeView === 'history' && (
              <div className="salary-history-view">
                <h4>Salary History</h4>
                {history.length > 0 ? (
                  <div className="history-list">
                    {history.map((item, index) => (
                      <div key={index} className="history-item">
                        <div className="history-header">
                          <span className="period">
                            {item.month}/{item.year}
                          </span>
                          <span className={`status ${item.status}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="history-details">
                          <div className="detail-item">
                            <label>Basic:</label>
                            <span>₹{item.basicSalary || 0}</span>
                          </div>
                          <div className="detail-item">
                            <label>Gross:</label>
                            <span>₹{item.grossSalary || 0}</span>
                          </div>
                          <div className="detail-item">
                            <label>Net:</label>
                            <span>₹{item.netSalary || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history-data">
                    <p>No salary history available.</p>
                    <p>History will appear here after salary processing.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedStaffSalary;