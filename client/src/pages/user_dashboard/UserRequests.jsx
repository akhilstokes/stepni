import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createRequest, getRequests, createSellBarrelIntake, getMySellAllowance, getMyCompanyBarrelsCount } from '../../services/customerService';
import { useConfirm } from '../../components/common/ConfirmDialog';

const initialBarrel = { type: 'BARREL', quantity: 1, notes: '' };
const initialSellBarrels = { name: '', phone: '', barrelCount: 1, notes: '' };
const initialComplaint = { type: 'COMPLAINT', subject: '', category: 'other', description: '' };

const UserRequests = () => {
  const { user: authUser, validateToken } = useAuth();
  const [tab, setTab] = useState('BARREL');
  const [barrel, setBarrel] = useState(initialBarrel);
  const [sellBarrels, setSellBarrels] = useState(initialSellBarrels);
  const [complaint, setComplaint] = useState(initialComplaint);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [geo, setGeo] = useState({ lat: null, lng: null, accuracy: null });
  const [geoStatus, setGeoStatus] = useState('');
  const confirm = useConfirm();
  const [info, setInfo] = useState('');
  const [allowance, setAllowance] = useState({ allowance: 0, used: 0, remaining: Infinity });
  const [myCompanyBarrels, setMyCompanyBarrels] = useState(0);

  const load = async () => {
    setLoading(true);
    try { setItems(await getRequests()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  const loadAllowance = async () => {
    try {
      const data = await getMySellAllowance();
      setAllowance({
        allowance: Number(data.allowance ?? 0),
        used: Number(data.used ?? 0),
        remaining: (data.remaining === Infinity ? Infinity : Number(data.remaining ?? 0))
      });
    } catch { /* ignore */ }
  };

  const loadMyCompanyBarrels = async () => {
    try {
      const n = await getMyCompanyBarrelsCount();
      setMyCompanyBarrels(Number(n) || 0);
    } catch { setMyCompanyBarrels(0); }
  };

  const submitSellBarrels = async () => {
    setSubmitting(true); setErr('');
    try {
      const count = Number(sellBarrels.barrelCount);
      
      if (myCompanyBarrels === 0) {
        setErr('You do not have any company barrels assigned. Please submit a barrel request first.');
        setTab('BARREL');
        return;
      }
      
      if (!sellBarrels.name || !sellBarrels.phone || !count) {
        setErr('Please enter name, phone and barrel count');
      } else if (count < 1) {
        setErr('Barrel count must be at least 1');
      } else if (count > myCompanyBarrels) {
        setErr(`Requested barrels (${count}) exceed your company barrels (${myCompanyBarrels}). You only have ${myCompanyBarrels} barrel(s) available.`);
      } else {
        const ok = await confirm('Confirm submission', 'Are you sure? Please wait for manager verification.');
        if (!ok) { setSubmitting(false); return; }
        await createSellBarrelIntake({
          name: String(sellBarrels.name).trim(),
          phone: String(sellBarrels.phone).trim(),
          barrelCount: count,
          notes: sellBarrels.notes || '',
          ...(geo.lat && geo.lng ? { location: { type: 'Point', coordinates: [geo.lng, geo.lat] }, locationAccuracy: geo.accuracy } : {})
        });
        setSellBarrels(initialSellBarrels);
        setGeo({ lat: null, lng: null, accuracy: null });
        setGeoStatus('');
        setInfo('Submitted. Please wait for manager verification.');
        await Promise.all([load(), loadAllowance(), loadMyCompanyBarrels()]);
      }
    } catch (e) { setErr(e?.message || 'Failed to submit sell barrels request'); }
    finally { setSubmitting(false); }
  };

  const getLocation = () => {
    if (!(navigator && 'geolocation' in navigator)) {
      setGeoStatus('Geolocation not supported by this browser.');
      return;
    }
    setGeoStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeo({ lat: latitude, lng: longitude, accuracy });
        setGeoStatus(`Location captured (±${Math.round(accuracy)}m)`);
      },
      (err) => {
        setGeoStatus(err?.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => { load(); loadAllowance(); loadMyCompanyBarrels(); }, []);

  useEffect(() => {
    if (tab === 'SELL_BARRELS') {
      loadMyCompanyBarrels();
    }
  }, [tab]);

  useEffect(() => {
    const shouldBlockPhone = (u) => {
      const prov = String(
        u?.provider || u?.authProvider || u?.loginProvider || u?.loginType || ''
      ).toLowerCase();
      return prov.includes('google');
    };

    if (authUser) {
      const name = authUser?.name || authUser?.fullName || authUser?.profile?.name || '';
      const phone = authUser?.phoneNumber || authUser?.phone || authUser?.mobile || authUser?.profile?.phone || '';
      const isGoogle = shouldBlockPhone(authUser);
      setSellBarrels(prev => ({
        ...prev,
        name: name || prev.name,
        phone: isGoogle ? '' : (phone || prev.phone)
      }));
      
      if (!isGoogle && !(phone || '').trim() && typeof validateToken === 'function') {
        validateToken().then((u) => {
          const p = u?.phoneNumber || u?.phone || u?.mobile || u?.profile?.phone || '';
          if (p) setSellBarrels(prev => ({ ...prev, phone: p }));
        }).catch(() => { });
      }
      return;
    }
    
    try {
      let u = null;
      const uStr = localStorage.getItem('user');
      if (uStr) {
        u = JSON.parse(uStr);
      } else {
        const profileStr = localStorage.getItem('profile') || localStorage.getItem('userProfile') || localStorage.getItem('auth');
        if (profileStr) {
          try {
            const parsed = JSON.parse(profileStr);
            u = parsed?.user || parsed;
          } catch { u = null; }
        }
      }
      if (u) {
        const name = u?.name || u?.fullName || u?.profile?.name || '';
        const phone = u?.phoneNumber || u?.phone || u?.mobile || u?.profile?.phone || '';
        const isGoogle = shouldBlockPhone(u);
        setSellBarrels(prev => ({
          ...prev,
          name: name || prev.name,
          phone: isGoogle ? '' : (phone || prev.phone)
        }));
      }
    } catch { }
  }, [authUser]);

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
        <button className={`btn-secondary ${tab === 'BARREL' ? 'active' : ''}`} onClick={() => setTab('BARREL')}>New Barrel</button>
        <button className={`btn-secondary ${tab === 'SELL_BARRELS' ? 'active' : ''}`} onClick={() => setTab('SELL_BARRELS')}>Sell Barrels</button>
        <button className={`btn-secondary ${tab === 'COMPLAINT' ? 'active' : ''}`} onClick={() => setTab('COMPLAINT')}>Complaint</button>
      </div>

      {err && <div className="alert error">{err}</div>}
      {info && <div className="alert" style={{ color: '#0a7' }}>{info}</div>}

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
      ) : tab === 'SELL_BARRELS' ? (
        <div className="dash-card" style={{ maxWidth: 640, display: 'grid', gap: 12 }}>
          {myCompanyBarrels === 0 && (
            <div className="alert error" style={{ backgroundColor: '#fee', border: '1px solid #fcc', color: '#c33', padding: '12px', borderRadius: '6px' }}>
              <strong>⚠️ No Company Barrels Available</strong>
              <p style={{ margin: '8px 0 0 0' }}>You don't have any company barrels assigned. Please submit a barrel request first to get barrels allocated to you.</p>
              <button 
                className="btn btn-sm" 
                onClick={() => setTab('BARREL')} 
                style={{ marginTop: '8px', backgroundColor: '#fff', color: '#c33', border: '1px solid #c33' }}
              >
                Go to Barrel Request
              </button>
            </div>
          )}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <label>
              Name
              <input type="text" value={sellBarrels.name} onChange={e => setSellBarrels({ ...sellBarrels, name: e.target.value })} />
            </label>
            <label>
              Phone
              <input type="tel" value={sellBarrels.phone} onChange={e => setSellBarrels({ ...sellBarrels, phone: e.target.value })} />
            </label>
          </div>
          <label>
            Barrel Count
            <input type="number" min={1} step={1} value={sellBarrels.barrelCount}
              onChange={e => setSellBarrels({ ...sellBarrels, barrelCount: e.target.value })}
            />
          </label>
          <div style={{ display: 'flex', gap: 12, color: myCompanyBarrels > 0 ? '#2563eb' : '#dc2626', fontSize: 13, alignItems: 'center' }}>
            <span style={{ fontWeight: myCompanyBarrels === 0 ? 'bold' : 'normal' }}>
              {myCompanyBarrels === 0 ? '⚠️ ' : ''}Company Barrels: {myCompanyBarrels}
            </span>
            {myCompanyBarrels === 0 && (
              <span style={{ fontSize: 11, color: '#666' }}>(Request barrels first)</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={getLocation}>Use my location</button>
            <span style={{ color: '#555' }}>{geoStatus}</span>
            {geo.lat && geo.lng && (
              <span style={{ fontSize: 12, color: '#2563eb' }}>Lat: {geo.lat.toFixed(5)}, Lng: {geo.lng.toFixed(5)}</span>
            )}
          </div>
          <label>
            Notes (optional)
            <textarea value={sellBarrels.notes} onChange={e => setSellBarrels({ ...sellBarrels, notes: e.target.value })} />
          </label>
          <button className="btn" onClick={submitSellBarrels} disabled={submitting || myCompanyBarrels === 0}>
            {submitting ? 'Submitting...' : myCompanyBarrels === 0 ? 'No Barrels Available' : 'Submit Request'}
          </button>
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
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ background: '#eef6ff', color: '#2563eb', padding: '6px 10px', borderRadius: 6 }}>
            Total Sell Barrels: {items.filter(r => r.type === 'SELL_BARRELS').reduce((sum, r) => sum + (Number(r.barrelCount) || 0), 0)}
          </span>
          <span style={{ background: '#f1f5f9', color: '#334155', padding: '6px 10px', borderRadius: 6 }}>
            Pending Sell Barrels: {items.filter(r => r.type === 'SELL_BARRELS' && String(r.status || '').toLowerCase() === 'pending').reduce((sum, r) => sum + (Number(r.barrelCount) || 0), 0)}
          </span>
        </div>
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
                  <th>Barrels</th>
                  <th>Subject/Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id || r._id}>
                    <td>{new Date(r.createdAt || Date.now()).toLocaleString('en-IN')}</td>
                    <td>{r.type === 'SELL_BARRELS' ? 'SELL BARRELS' : r.type}</td>
                    <td>
                      {r.type === 'SELL_BARRELS'
                        ? (r.barrelCount ?? r.count ?? '-')
                        : r.type === 'BARREL'
                          ? (r.quantity || 1)
                          : '-'}
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