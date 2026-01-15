import React, { useEffect, useState } from 'react';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { listDailyWageWorkers, calcMonthlySalary, getSalarySummary } from '../../services/accountantService';
import { toast } from 'react-toastify';
import './AccountantSalaries.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const AccountantSalaries = () => {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const doConfirm = useConfirm();

  const [showAutoCalc, setShowAutoCalc] = useState(false);

  // Edit State
  const [editingSalary, setEditingSalary] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    grossSalary: 0,
    providentFund: 0,
    professionalTax: 0,
    incomeTax: 0,
    otherDeductions: 0
  });

  // Wage Calculator State
  const [calcForm, setCalcForm] = useState({
    dailyWage: 0,
    days: 0,
    otHours: 0,
    otRate: 0,
    allowance: 0,
    pf: 0,
    profTax: 0,
    incomeTax: 0,
    otherDed: 0
  });

  const [totals, setTotals] = useState({
    gross: 0,
    deductions: 0,
    net: 0
  });

  // Load initial data
  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadSalaries(selected);
  }, [selected, year]);

  // Auto-Calculate Effect
  useEffect(() => {
    const { dailyWage, days, otHours, otRate, allowance, pf, profTax, incomeTax, otherDed } = calcForm;

    // Earnings
    const baseEarnings = (Number(dailyWage) || 0) * (Number(days) || 0);
    const otEarnings = (Number(otHours) || 0) * (Number(otRate) || 0);
    const gross = baseEarnings + otEarnings + (Number(allowance) || 0);

    // Deductions
    const totalDeductions = (Number(pf) || 0) + (Number(profTax) || 0) + (Number(incomeTax) || 0) + (Number(otherDed) || 0);

    // Net
    const net = gross - totalDeductions;

    setTotals({
      gross: Number(gross.toFixed(2)),
      deductions: Number(totalDeductions.toFixed(2)),
      net: Number(net.toFixed(2))
    });
  }, [calcForm]);

  const loadStaff = async () => {
    try {
      const res = await fetch(`${API}/api/users`, { headers: authHeaders() });
      const data = await res.json();

      const arr = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
      // Filter out admin or irrelevant roles if needed, but keeping broadly for now as requested "All Staff"
      setStaff(arr.filter(u => u.role !== 'admin' && u.role !== 'user'));
    } catch {
      setStaff([]);
    }
  };

  const loadSalaries = async staffId => {
    if (!staffId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let url = `${API}/api/salary/history/${staffId}?year=${year}`;
      if (staffId === 'all') {
        url = `${API}/api/salary/all?year=${year}`;
      }

      const res = await fetch(url, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();

      setEntries(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (e) {
      setError(e?.message || 'Failed to load salaries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate Salary (Backend trigger)
  const generate = async () => {
    if (!selected) {
      setError('Select a staff member or All');
      return;
    }

    // Bulk Generation Logic
    if (selected === 'all') {
      const ok = await doConfirm('Generate All', `Generate salaries for ALL staff for ${month}/${year}?`);
      if (!ok) return;

      setLoading(true);
      setError('');
      let successCount = 0;
      let failCount = 0;

      try {
        for (const s of staff) {
          try {
            const res = await fetch(`${API}/api/salary/generate/${s._id}`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({ month, year }),
            });
            if (res.ok) successCount++;
            else failCount++;
          } catch (e) {
            failCount++;
          }
        }
        await loadSalaries('all');
        toast.success(`Batch complete: ${successCount} generated, ${failCount} skipped/failed`);
      } catch (e) {
        setError('Batch generation failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single Generation Logic
    const ok = await doConfirm('Generate Salary', `Generate salary for ${month}/${year}?`);
    if (!ok) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/api/salary/generate/${selected}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ month, year }),
      });
      if (!res.ok) throw new Error(`Generate failed (${res.status})`);
      await loadSalaries(selected);
      toast.success('Salary generated successfully');
    } catch (e) {
      setError(e?.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const approve = async salaryId => {
    const ok = await doConfirm('Approve Salary', 'Mark this salary as approved?');
    if (!ok) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/api/salary/approve/${salaryId}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Approve failed (${res.status})`);
      await loadSalaries(selected);
      toast.success('Salary approved');
    } catch (e) {
      setError(e?.message || 'Approve failed');
    } finally {
      setLoading(false);
    }
  };

  const pay = async salaryId => {
    const method = window.prompt('Enter payment method (e.g., cash, bank, upi)');
    if (!method) return;
    const ref = window.prompt('Payment reference (optional)') || '';
    const ok = await doConfirm('Mark as Paid', `Mark this salary as PAID via ${method}?`);
    if (!ok) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/api/salary/pay/${salaryId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ paymentMethod: method, paymentReference: ref }),
      });
      if (!res.ok) throw new Error(`Pay failed (${res.status})`);
      await loadSalaries(selected);
      toast.success('Marked as paid');
    } catch (e) {
      setError(e?.message || 'Pay failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteSalary = async (salaryId) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/salary/${salaryId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await loadSalaries(selected);
      toast.success('Salary record deleted');
    } catch (e) {
      setError(e?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingSalary(entry);
    setEditForm({
      grossSalary: entry.grossSalary || 0,
      providentFund: entry.providentFund || 0,
      professionalTax: entry.professionalTax || 0,
      incomeTax: entry.incomeTax || 0,
      otherDeductions: entry.otherDeductions || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/salary/${editingSalary._id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editForm)
      });

      if (!res.ok) throw new Error(`Update failed (${res.status})`);

      await loadSalaries(selected);
      toast.success('Salary updated successfully');
      setShowEditModal(false);
      setEditingSalary(null);
    } catch (e) {
      setError(e?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Calculator Handlers
  const handleCalcChange = (e) => {
    const { name, value } = e.target;
    setCalcForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setCalcForm({
      dailyWage: 0,
      days: 0,
      otHours: 0,
      otRate: 0,
      allowance: 0,
      pf: 0,
      profTax: 0,
      incomeTax: 0,
      otherDed: 0
    });
  };

  const handleCopyNet = () => {
    navigator.clipboard.writeText(totals.net.toString());
    toast.info(`Copied Net Salary: ${totals.net}`);
  };

  return (
    <div className="salaries-container">
      <h2 className="page-title">Salaries</h2>

      {error && <div className="error-alert">{error}</div>}

      {/* Wage Calculator Section */}
      <div className="salary-card">
        <div className="card-header">
          <h3 className="card-title">Wage Calculator</h3>
          <button onClick={() => setShowAutoCalc(!showAutoCalc)} className="btn-toggle">
            {showAutoCalc ? 'Hide' : 'Show'} Calculator
          </button>
        </div>

        {showAutoCalc && (
          <div className="calculator-content">
            <div className="calc-grid">
              {/* Earnings Column */}
              <div className="calc-column">
                <h4 className="column-header">Earnings</h4>
                <div className="form-group">
                  <label className="form-label">Daily Wage</label>
                  <input
                    type="number"
                    name="dailyWage"
                    value={calcForm.dailyWage}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Days</label>
                  <input
                    type="number"
                    name="days"
                    value={calcForm.days}
                    onChange={handleCalcChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">OT Hours</label>
                  <input
                    type="number"
                    name="otHours"
                    value={calcForm.otHours}
                    onChange={handleCalcChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">OT Rate</label>
                  <input
                    type="number"
                    name="otRate"
                    value={calcForm.otRate}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Allowance</label>
                  <input
                    type="number"
                    name="allowance"
                    value={calcForm.allowance}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Deductions Column */}
              <div className="calc-column">
                <h4 className="column-header">Deductions</h4>
                <div className="form-group">
                  <label className="form-label">PF</label>
                  <input
                    type="number"
                    name="pf"
                    value={calcForm.pf}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Professional Tax</label>
                  <input
                    type="number"
                    name="profTax"
                    value={calcForm.profTax}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Income Tax</label>
                  <input
                    type="number"
                    name="incomeTax"
                    value={calcForm.incomeTax}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Other Deductions</label>
                  <input
                    type="number"
                    name="otherDed"
                    value={calcForm.otherDed}
                    onChange={handleCalcChange}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Totals & Actions */}
            <div className="totals-section">
              <div className="total-card">
                <span className="total-label">Gross</span>
                <span className="total-value">{totals.gross.toFixed(2)}</span>
              </div>
              <div className="total-card">
                <span className="total-label">Deductions</span>
                <span className="total-value">{totals.deductions.toFixed(2)}</span>
              </div>
              <div className="total-card">
                <span className="total-label">Net</span>
                <span className="total-value net-value">{totals.net.toFixed(2)}</span>
              </div>

              <div className="calc-actions">
                <button onClick={handleReset} className="btn-secondary">Reset</button>
                <button onClick={handleCopyNet} className="btn-secondary">Copy Net</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Salary Generation Section */}
      <div className="salary-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Generate Salary Record</h3>
        <div className="controls-row">
          <div className="control-group">
            <label className="form-label">Staff Member</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="form-select"
            >
              <option value="">Select Staff</option>
              <option value="all">All Staff</option>
              {staff.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.role?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
          <div className="control-group-sm">
            <label className="form-label">Month</label>
            <input
              type="number"
              min="1" max="12"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="form-input"
            />
          </div>
          <div className="control-group-md">
            <label className="form-label">Year</label>
            <input
              type="number"
              min="2020" max="2100"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="form-input"
            />
          </div>
          <button
            className="btn-primary"
            onClick={generate}
            disabled={loading}
          >
            {loading ? 'Processing...' : selected === 'all' ? 'Generate for All' : 'Generate Record'}
          </button>
        </div>
      </div>

      {/* Salary List Table */}
      <div className="salary-table-container">
        <table className="salary-table">
          <thead>
            <tr>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Gross</th>
              <th style={{ textAlign: 'right' }}>Deductions</th>
              <th style={{ textAlign: 'right' }}>Net Pay</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((e, idx) => {
                const totalDed = (e.providentFund || 0) + (e.professionalTax || 0) + (e.incomeTax || 0) + (e.otherDeductions || 0);
                return (
                  <tr key={e._id || idx}>
                    <td>{e.month}/{e.year}</td>
                    <td style={{ textAlign: 'right' }}>{e.grossSalary?.toFixed(2) || '-'}</td>
                    <td style={{ textAlign: 'right' }} className="amount-negative">{totalDed.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }} className="amount-positive">{e.netSalary?.toFixed(2) || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${e.status === 'paid' ? 'status-paid' : e.status === 'approved' ? 'status-approved' : 'status-draft'}`}>
                        {e.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        {e.status === 'draft' && (
                          <>
                            <button onClick={() => handleEdit(e)} className="btn-edit-action">Edit</button>
                            <button onClick={() => approve(e._id)} className="btn-approve">Approve</button>
                            <button onClick={() => deleteSalary(e._id)} className="btn-delete-action">Delete</button>
                          </>
                        )}
                        {e.status === 'approved' && (
                          <button onClick={() => pay(e._id)} className="btn-paid">Mark Paid</button>
                        )}
                        <a href={`${API}/api/salary/payslip/${e._id}`} target="_blank" rel="noreferrer" className="link-payslip">
                          Payslip
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">No salary records found for this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Edit Salary Record</h3>
            <form onSubmit={handleUpdateSalary}>
              <div className="form-group">
                <label className="form-label">Gross Salary</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.grossSalary}
                  onChange={e => setEditForm({ ...editForm, grossSalary: Number(e.target.value) })}
                />
              </div>
              <div className="calc-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">PF</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.providentFund}
                    onChange={e => setEditForm({ ...editForm, providentFund: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prof Tax</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.professionalTax}
                    onChange={e => setEditForm({ ...editForm, professionalTax: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Income Tax</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.incomeTax}
                    onChange={e => setEditForm({ ...editForm, incomeTax: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Other Ded</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.otherDeductions}
                    onChange={e => setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantSalaries;