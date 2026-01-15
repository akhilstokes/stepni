import React, { useState, useEffect } from 'react';
import './FieldStaffReports.css';

const FieldStaffReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [newReport, setNewReport] = useState({
    type: 'daily',
    description: '',
    barrelsCollected: 0,
    barrelsDelivered: 0,
    issues: '',
    notes: '',
    // Maintenance fields
    machineId: '',
    machineName: '',
    machineStatus: 'operational',
    barrelIds: [],
    barrelConditions: [],
    maintenanceType: '',
    partsReplaced: '',
    laborHours: 0
  });

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/field-staff/reports?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Mock data for development
      setReports([
        {
          id: 1,
          date: selectedDate,
          type: 'daily',
          barrelsCollected: 15,
          barrelsDelivered: 15,
          status: 'completed',
          issues: 'None',
          notes: 'All deliveries completed on time',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/field-staff/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newReport,
          date: selectedDate
        })
      });
      
      if (response.ok) {
        setShowCreateReport(false);
        setNewReport({
          type: 'daily',
          description: '',
          barrelsCollected: 0,
          barrelsDelivered: 0,
          issues: '',
          notes: '',
          machineId: '',
          machineName: '',
          machineStatus: 'operational',
          barrelIds: [],
          barrelConditions: [],
          maintenanceType: '',
          partsReplaced: '',
          laborHours: 0
        });
        fetchReports();
      }
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="field-staff-reports">
      <div className="reports-header">
        <h2>Daily Reports</h2>
        <div className="header-controls">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateReport(true)}
          >
            <i className="fas fa-plus"></i>
            New Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading reports...</p>
        </div>
      ) : (
        <div className="reports-content">
          {reports.length > 0 ? (
            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <div className="report-info">
                      <h3>
                        {report.type === 'maintenance' ? 'Maintenance Report' : 'Daily Report'} - {new Date(report.date).toLocaleDateString()}
                      </h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(report.status) }}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="report-time">
                      {new Date(report.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Daily Report Stats */}
                  {report.type === 'daily' && (
                    <div className="report-stats">
                      <div className="stat-item">
                        <div className="stat-icon">
                          <i className="fas fa-arrow-up"></i>
                        </div>
                        <div className="stat-content">
                          <div className="stat-value">{report.barrelsCollected}</div>
                          <div className="stat-label">Collected</div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon">
                          <i className="fas fa-arrow-down"></i>
                        </div>
                        <div className="stat-content">
                          <div className="stat-value">{report.barrelsDelivered}</div>
                          <div className="stat-label">Delivered</div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon">
                          <i className="fas fa-percentage"></i>
                        </div>
                        <div className="stat-content">
                          <div className="stat-value">
                            {report.barrelsCollected > 0 ? 
                              Math.round((report.barrelsDelivered / report.barrelsCollected) * 100) : 0}%
                          </div>
                          <div className="stat-label">Completion</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Maintenance Report Details */}
                  {report.type === 'maintenance' && (
                    <>
                      <div className="maintenance-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <i className="fas fa-cog"></i>
                            <div>
                              <div className="detail-label">Machine</div>
                              <div className="detail-value">{report.machineName || 'N/A'}</div>
                              <div className="detail-subtext">{report.machineId || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-tools"></i>
                            <div>
                              <div className="detail-label">Maintenance Type</div>
                              <div className="detail-value">{report.maintenanceType || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-clock"></i>
                            <div>
                              <div className="detail-label">Labor Hours</div>
                              <div className="detail-value">{report.laborHours || 0} hrs</div>
                            </div>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-info-circle"></i>
                            <div>
                              <div className="detail-label">Status</div>
                              <div className="detail-value">{report.machineStatus || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {report.barrelIds && report.barrelIds.length > 0 && (
                          <div className="barrels-section">
                            <h4><i className="fas fa-drum"></i> Barrels Serviced ({report.barrelIds.length})</h4>
                            <div className="barrel-chips">
                              {report.barrelIds.map(id => (
                                <span key={id} className="barrel-chip">{id}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.partsReplaced && (
                          <div className="parts-section">
                            <h4><i className="fas fa-wrench"></i> Parts Replaced</h4>
                            <p>{report.partsReplaced}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {report.issues && (
                    <div className="report-section">
                      <h4>Issues Reported:</h4>
                      <p>{report.issues}</p>
                    </div>
                  )}

                  {report.notes && (
                    <div className="report-section">
                      <h4>Notes:</h4>
                      <p>{report.notes}</p>
                    </div>
                  )}

                  <div className="report-actions">
                    <button className="btn btn-outline-primary">
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="fas fa-download"></i>
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reports">
              <i className="fas fa-file-alt"></i>
              <h3>No Reports Found</h3>
              <p>No reports found for {new Date(selectedDate).toLocaleDateString()}</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateReport(true)}
              >
                Create First Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Daily Report</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateReport(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="report-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Report Type</label>
                  <select
                    value={newReport.type}
                    onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                  >
                    <option value="daily">Daily Report</option>
                    <option value="maintenance">Maintenance Report</option>
                    <option value="incident">Incident Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Daily Report Fields */}
              {newReport.type === 'daily' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Barrels Collected</label>
                      <input
                        type="number"
                        value={newReport.barrelsCollected}
                        onChange={(e) => setNewReport({...newReport, barrelsCollected: parseInt(e.target.value)})}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Barrels Delivered</label>
                      <input
                        type="number"
                        value={newReport.barrelsDelivered}
                        onChange={(e) => setNewReport({...newReport, barrelsDelivered: parseInt(e.target.value)})}
                        min="0"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Maintenance Report Fields */}
              {newReport.type === 'maintenance' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Machine ID</label>
                      <input
                        type="text"
                        value={newReport.machineId}
                        onChange={(e) => setNewReport({...newReport, machineId: e.target.value})}
                        placeholder="e.g., MACH001"
                      />
                    </div>
                    <div className="form-group">
                      <label>Machine Name</label>
                      <input
                        type="text"
                        value={newReport.machineName}
                        onChange={(e) => setNewReport({...newReport, machineName: e.target.value})}
                        placeholder="e.g., Barrel Washing Machine"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Machine Status</label>
                      <select
                        value={newReport.machineStatus}
                        onChange={(e) => setNewReport({...newReport, machineStatus: e.target.value})}
                      >
                        <option value="operational">Operational</option>
                        <option value="needs_repair">Needs Repair</option>
                        <option value="under_maintenance">Under Maintenance</option>
                        <option value="out_of_service">Out of Service</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Maintenance Type</label>
                      <select
                        value={newReport.maintenanceType}
                        onChange={(e) => setNewReport({...newReport, maintenanceType: e.target.value})}
                      >
                        <option value="">Select Type</option>
                        <option value="preventive">Preventive Maintenance</option>
                        <option value="corrective">Corrective Maintenance</option>
                        <option value="inspection">Inspection</option>
                        <option value="repair">Repair</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Barrel IDs (comma separated)</label>
                      <input
                        type="text"
                        value={newReport.barrelIds.join(', ')}
                        onChange={(e) => setNewReport({
                          ...newReport, 
                          barrelIds: e.target.value.split(',').map(id => id.trim()).filter(id => id)
                        })}
                        placeholder="BHFP1, BHFP2, BHFP3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Labor Hours</label>
                      <input
                        type="number"
                        value={newReport.laborHours}
                        onChange={(e) => setNewReport({...newReport, laborHours: parseFloat(e.target.value)})}
                        min="0"
                        step="0.5"
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Parts Replaced</label>
                    <textarea
                      value={newReport.partsReplaced}
                      onChange={(e) => setNewReport({...newReport, partsReplaced: e.target.value})}
                      placeholder="List any parts that were replaced..."
                      rows="2"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Issues (if any)</label>
                <textarea
                  value={newReport.issues}
                  onChange={(e) => setNewReport({...newReport, issues: e.target.value})}
                  placeholder="Describe any issues encountered..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={newReport.notes}
                  onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                  placeholder="Any additional notes or observations..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateReport(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldStaffReports;