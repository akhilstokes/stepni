import React, { useEffect, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';
import './LabDashboard.css'; // Ensure we use the dashboard theme



const LabReports = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({ date: '', sampleId: '', supplier: '', drc: '', barrels: '' });



  const run = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${base}/api/latex/reports/drc?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`Report failed (${res.status})`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
    } catch (e2) { setError(e2?.message || 'Failed to load report'); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { /* on mount, optionally auto-load today */ }, []);


  const handleCreate = async () => {
    // Logic to save the new report goes here
    // For now, just close the modal
    console.log('Creating Report', newReport);
    setShowCreateModal(false);
    alert('Report Created (Simulation)');
  };

  return (
    <div className="lab-dashboard" style={{ position: 'relative' }}>
      {/* Header Section */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Reports</h1>
          <p className="dashboard-subtitle">Generate and manage lab analysis reports.</p>
        </div>
        <button
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus"></i> Add
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Report Configuration Card */}
      <div className="dash-card" style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          Report Configuration
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', alignItems: 'end' }}>

          {/* From Date Input with Styled Group */}
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRight: '1px solid #e2e8f0', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
              From Date
            </div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ border: 'none', padding: '10px 16px', outline: 'none', width: '100%', color: '#1e293b' }}
            />
          </div>

          {/* To Date Input with Styled Group */}
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRight: '1px solid #e2e8f0', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
              To Date
            </div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ border: 'none', padding: '10px 16px', outline: 'none', width: '100%', color: '#1e293b' }}
            />
          </div>

          {/* Action Button */}
          <button
            className="action-button action-primary"
            onClick={run}
            disabled={loading}
            style={{ border: 'none', cursor: 'pointer', justifyContent: 'center', height: '42px' }}
          >
            {loading ? (
              <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
            ) : (
              <span>Click Me</span>
            )}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="dash-card" style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Generated Results</h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supplier</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty (L)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DRC %</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', color: '#334155' }}>
                    {r.analyzedAt ? new Date(r.analyzedAt).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', fontWeight: '500', color: '#0f172a' }}>
                    {r.sampleId || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', color: '#64748b' }}>
                    {r.supplier || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {r.batch || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', fontWeight: '600', color: '#334155' }}>
                    {r.quantityLiters ?? '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
                    {r.drc ? (
                      <span style={{ color: r.drc > 30 ? '#16a34a' : '#ea580c', fontWeight: '700' }}>
                        {r.drc}%
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                    <div>No data found for the selected range</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b' }}>Create New Report</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Date</label>
              <input
                type="date"
                value={newReport.date}
                onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Sample ID</label>
              <input
                type="text"
                placeholder="Enter Sample ID"
                value={newReport.sampleId}
                onChange={(e) => setNewReport({ ...newReport, sampleId: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Supplier Name</label>
              <input
                type="text"
                placeholder="Enter Supplier Name"
                value={newReport.supplier}
                onChange={(e) => setNewReport({ ...newReport, supplier: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>DRC %</label>
              <input
                type="number"
                placeholder="Enter DRC Rate"
                value={newReport.drc}
                onChange={(e) => setNewReport({ ...newReport, drc: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Number of Barrels</label>
              <input
                type="number"
                placeholder="Enter Number of Barrels"
                value={newReport.barrels}
                onChange={(e) => setNewReport({ ...newReport, barrels: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '500', color: '#64748b' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', cursor: 'pointer', fontWeight: '600', color: 'white' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LabReports;
