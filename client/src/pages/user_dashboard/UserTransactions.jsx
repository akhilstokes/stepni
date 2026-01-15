import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions, updateTransaction, publishTransaction } from '../../services/customerService';
import './userDashboardTheme.css';

const UserTransactions = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);


  // Stats for the top cards (calculated from current rows for demo, ideal would be API)
  const totalAmount = rows.reduce((sum, r) => sum + (parseFloat(r.finalAmount) || 0), 0);
  const pendingCount = rows.filter(r => !r.isVerified).length; // Assuming logical property



  const todayStr = new Date().toISOString().split('T')[0];

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTransactions({ page, pageSize, from, to });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { load(); }, [page, pageSize]);


  const beginEdit = (tx) => {
    const ok = window.confirm('Are you sure you want to edit this transaction?');
    if (!ok) return;
    setEditingId(tx.id || tx._id);
    setEditData({
      weightKg: tx.weightKg ?? tx.weight ?? '',
      drcPercent: tx.drcPercent ?? '',
      finalAmount: tx.finalAmount ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await updateTransaction(id, editData);


      // reflect changes locally to keep UX snappy

      setRows(prev => prev.map(r => (r._id === id || r.id === id) ? { ...r, ...editData } : r));
      setEditingId(null);
      setEditData({});
    } catch (e) {
      alert(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const doPublish = async (id) => {
    const ok = window.confirm('Publish changes? This will finalize the transaction.');
    if (!ok) return;
    setPublishing(true);
    try {
      await publishTransaction(id);


      // Optionally reload to ensure server state

      await load();
      alert('Published successfully');
    } catch (e) {
      alert(e?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  return (

    <div className="transactions-page">
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 0.5rem 0' }}>
          <i className="fas fa-receipt" style={{ color: '#8b5cf6' }}></i>
          Transactions & Bills
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          View and manage your payment history, bills, and recent activity.
        </p>
      </div>

      {/* Filter Stats Section */}
      <div className="dash-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>
              From Date
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-calendar-alt" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input
                type="date"
                value={from}
                max={todayStr}
                onChange={e => {
                  const v = e.target.value;
                  if (to && to < v) setTo(v);
                  setFrom(v);
                }}
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>
              To Date
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-calendar-alt" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input
                type="date"
                value={to}
                min={from}
                max={todayStr}
                onChange={e => {
                  const v = e.target.value;
                  setTo(from && v < from ? from : v);
                }}
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
          </div>
          <div>
            <button className="btn" onClick={() => { setPage(1); load(); }} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-filter"></i> Filter Results
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#8b5cf6' }}></i>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading transactions...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <i className="fas fa-file-invoice" style={{ fontSize: '1.75rem', color: '#94a3b8' }}></i>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#1e293b', margin: '0 0 0.5rem 0' }}>No Transactions Found</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            We couldn't find any transactions for the selected date range. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="dash-card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch ID</th>
                  <th>Weight (kg)</th>
                  <th>DRC (%)</th>
                  <th>Amount (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(tx => {
                  const id = tx.id || tx._id;
                  const isEditing = editingId === id;
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <i className="fas fa-calendar-day" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <span style={{ fontWeight: '500' }}>
                            {new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                          {tx.batchId || '#N/A'}
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" step="0.01" value={editData.weightKg}
                            onChange={e => setEditData(d => ({ ...d, weightKg: e.target.value }))} style={{ width: '100px' }} />
                        ) : (
                          <span style={{ fontWeight: '600' }}>{tx.weightKg ?? tx.weight ?? '-'}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" step="0.01" value={editData.drcPercent}
                            onChange={e => setEditData(d => ({ ...d, drcPercent: e.target.value }))} style={{ width: '80px' }} />
                        ) : (
                          <span>{tx.drcPercent ? `${tx.drcPercent}%` : '-'}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" step="0.01" value={editData.finalAmount}
                            onChange={e => setEditData(d => ({ ...d, finalAmount: e.target.value }))} style={{ width: '100px' }} />
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: '700' }}>
                            {tx.finalAmount ? `₹${parseFloat(tx.finalAmount).toLocaleString('en-IN')}` : '-'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {!isEditing ? (
                            <>
                              <Link to={`/user/transactions/${id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                View
                              </Link>
                              <button className="btn-secondary" onClick={() => beginEdit(tx)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                Edit
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn" disabled={saving} onClick={() => saveEdit(id)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                {saving ? '...' : 'Save'}
                              </button>
                              <button className="btn-secondary" onClick={cancelEdit} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                Cancel
                              </button>
                              <button className="btn" style={{ background: '#ef4444', borderColor: '#ef4444' }} disabled={publishing} onClick={() => doPublish(id)}>
                                {publishing ? '...' : 'Publish'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Showing page <span style={{ fontWeight: '600', color: '#0f172a' }}>{page}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ opacity: page === 1 ? 0.5 : 1 }}
              >
                <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i> Prev
              </button>
              <button
                className="btn-secondary"
                disabled={rows.length < pageSize || page * pageSize >= total}
                onClick={() => setPage(p => p + 1)}
                style={{ opacity: (rows.length < pageSize || page * pageSize >= total) ? 0.5 : 1 }}
              >
                Next <i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTransactions;
