import React, { useEffect, useState } from 'react';
import { createRequest, getRequests } from '../../services/customerService';

const initialBarrel = { type: 'BARREL', quantity: 1, notes: '' };
const initialComplaint = { type: 'COMPLAINT', subject: '', category: 'other', description: '' };

const UserRequests = () => {
  const [tab, setTab] = useState('BARREL');
  const [barrel, setBarrel] = useState(initialBarrel);
  const [complaint, setComplaint] = useState(initialComplaint);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setItems(await getRequests()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitBarrel = async () => {
    setSubmitting(true); setErr('');
    try {
      const qty = Number(barrel.quantity) || 1;
      if (qty < 1 || qty > 50) {
        setErr('Quantity must be between 1 and 50 barrels');
        setSubmitting(false);
        return;
      }
      await createRequest({ type: 'BARREL', quantity: qty, notes: barrel.notes });
      setBarrel(initialBarrel);
      await load();
    } catch (e) { setErr('Failed to submit request'); }
    finally { setSubmitting(false); }
  };

  const submitComplaint = async () => {
    setSubmitting(true); setErr('');
    try {
      await createRequest({ type: 'COMPLAINT', subject: complaint.subject, category: complaint.category, description: complaint.description });
      setComplaint(initialComplaint);
      await load();
    } catch (e) { setErr('Failed to submit complaint'); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <h2>Requests & Complaints</h2>

      <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn-secondary ${tab === 'BARREL' ? 'active' : ''}`} onClick={() => setTab('BARREL')}>Request Barrels</button>
        <button className={`btn-secondary ${tab === 'COMPLAINT' ? 'active' : ''}`} onClick={() => setTab('COMPLAINT')}>Complaint</button>
      </div>

      {err && <div className="alert error">{err}</div>}

      {tab === 'BARREL' ? (
        <div className="dash-card" style={{ maxWidth: 520, display: 'grid', gap: 12 }}>
          <label>
            Quantity (Max: 50 barrels)
            <input type="number" min={1} max={50} step={1} value={barrel.quantity} onChange={e => setBarrel({ ...barrel, quantity: e.target.value })} />
          </label>
          <label>
            Notes (optional)
            <textarea value={barrel.notes} onChange={e => setBarrel({ ...barrel, notes: e.target.value })} />
          </label>
          <button className="btn" onClick={submitBarrel} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
        </div>
      ) : (
        <div className="dash-card" style={{ maxWidth: 640, display: 'grid', gap: 12 }}>
          <label>
            Subject
            <input type="text" value={complaint.subject} onChange={e => setComplaint({ ...complaint, subject: e.target.value })} />
          </label>
          <label>
            Category
            <select value={complaint.category} onChange={e => setComplaint({ ...complaint, category: e.target.value })}>
              <option value="other">Pickup Delay</option>
              <option value="other">Billing Discrepancy</option>
              <option value="barrel">Barrel Damage</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Description
            <textarea rows={4} value={complaint.description} onChange={e => setComplaint({ ...complaint, description: e.target.value })} />
          </label>
          <button className="btn" onClick={submitComplaint} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Complaint'}</button>
        </div>
      )}

      <div className="dash-card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>My Requests</h3>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <div className="no-data">No requests</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Subject/Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id || r._id}>
                    <td>{new Date(r.createdAt || Date.now()).toLocaleString('en-IN')}</td>
                    <td>{r.type}</td>
                    <td>
                      {r.type === 'BARREL' ? (r.quantity || 1) : '-'}
                    </td>
                    <td>{r.type === 'BARREL' ? (r.notes || '-') : (r.subject || r.notes || '-')}</td>
                    <td><span className={`badge status-${(r.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>{r.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRequests;
