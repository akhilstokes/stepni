import React, { useEffect, useState } from 'react';
import { listDailyWageWorkers, calcMonthlySalary, getSalarySummary } from '../../services/accountantService';

import './AccountantWages.css';



export default function AccountantWages() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const [calculating, setCalculating] = useState(false);



  const loadWorkers = async () => {
    setLoading(true);
    try {
      const list = await listDailyWageWorkers({ limit: 100 });
      setWorkers(list);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkers(); }, []);

  const runCalc = async (w) => {
    setSelected(w);
    setResult(null);
    const ok = window.confirm(`Auto-calculate wages for ${w.name}?`);
    if (!ok) return;


    setCalculating(true);
    try {
      const data = await calcMonthlySalary(w._id || w.id, { year, month });
      const summary = await getSalarySummary(w._id || w.id, { year, month });
      setResult({ calc: data, summary });
    } catch (error) {
      console.error("Calculation failed", error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Helper to extract values safely
  const getVal = (obj, path, fallback = 0) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
  };

  return (
    <div className="wages-container">
      {/* Enhanced Page Header */}
      <div className="page-header" style={{backgroundColor: '#000000', color: '#ffffff'}}>
        <div className="header-content">
          <h1 className="page-title" style={{color: '#ffffff', fontSize: '56px', fontWeight: '900', textShadow: 'none', opacity: '1'}}>
            Auto-calculate Wages
          </h1>
          <p className="page-subtitle" style={{color: '#ffffff', fontSize: '18px', fontWeight: '500', textShadow: 'none', opacity: '1'}}>
            Automated salary calculation for daily wage workers
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-card">
        <div className="controls-row">
          <div className="form-group">
            <label className="form-label">Year</label>
            <input
              type="number"
              className="form-input"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Month</label>
            <input
              type="number"
              min={1}
              max={12}
              className="form-input"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Workers Table */}
      {loading ? <div className="loading-spinner"></div> : (
        <div className="table-container">
          <table className="wages-table">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Daily Wage (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workers.length > 0 ? workers.map(w => (
                <tr key={w._id || w.id}>
                  <td style={{ fontWeight: 500 }}>{w.name}</td>
                  <td>{w.dailyWage ?? '-'}</td>
                  <td>
                    <button className="btn-calc" onClick={() => runCalc(w)}>
                      Calculate
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No workers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && result && !calculating && (
        <div className="result-section">
          <div className="salary-slip-card">
            <div className="slip-header">
              <div className="slip-title">
                <h3>{selected.name}</h3>
                <p className="slip-subtitle">Salary Calculation Result</p>
              </div>
              <div className="slip-period">
                <span className="period-label">Period</span>
                <span className="period-value">{month}/{year}</span>
              </div>
            </div>

            <div className="slip-body">
              {/* Earnings Column */}
              <div className="slip-column">
                <h4 className="slip-column-header">Earnings</h4>
                <div className="slip-row">
                  <span className="row-label">Working Days</span>
                  <span className="row-value">{getVal(result, 'calc.month.workingDays')}</span>
                </div>
                <div className="slip-row">
                  <span className="row-label">Gross Salary</span>
                  <span className="row-value value-highlight">{formatCurrency(getVal(result, 'calc.month.grossSalary'))}</span>
                </div>
                <div className="slip-row">
                  <span className="row-label">Bonus</span>
                  <span className="row-value">{formatCurrency(getVal(result, 'calc.month.bonusAmount'))}</span>
                </div>
                <div className="slip-row">
                  <span className="row-label">Transportation</span>
                  <span className="row-value">{formatCurrency(getVal(result, 'summary.benefits.transportAllowance'))}</span>
                </div>
                <div className="slip-row">
                  <span className="row-label">Food Allowance</span>
                  <span className="row-value">{formatCurrency(getVal(result, 'summary.benefits.foodAllowance'))}</span>
                </div>
              </div>

              {/* Deductions & Net Column */}
              <div className="slip-column">
                <h4 className="slip-column-header">Deductions</h4>
                <div className="slip-row">
                  <span className="row-label">Advance Taken</span>
                  <span className="row-value" style={{ color: '#ef4444' }}>
                    {formatCurrency(getVal(result, 'calc.month.advanceAmount'))}
                  </span>
                </div>
                <div className="slip-row">
                  <span className="row-label">Other Deductions</span>
                  <span className="row-value" style={{ color: '#ef4444' }}>
                    {formatCurrency(getVal(result, 'calc.month.deductionAmount'))}
                  </span>
                </div>
                <div className="slip-row">
                  <span className="row-label">Provident Fund</span>
                  <span className="row-value" style={{ color: '#ef4444' }}>
                    {formatCurrency(getVal(result, 'summary.benefits.providentFund'))}
                  </span>
                </div>
              </div>
            </div>

            <div className="slip-footer">
              <div className="net-pay-box">
                <span className="net-label">Net Payable Amount</span>
                <span className="net-amount">
                  {formatCurrency(getVal(result, 'calc.month.pendingAmount') || getVal(result, 'calc.month.grossSalary'))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
