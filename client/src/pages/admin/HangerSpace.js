
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './HangerSpace.css';
import { listHangerSpaces, seedHangerGrid, setHangerSpaceStatus, bulkSetHangerSpaceStatus } from '../../services/adminService';

// Rows D through L
const ROWS = ['D','E','F','G','H','I','J','K','L'];

const Block = ({ label, cols = 10, statusMap, onClickSlot }) => {
  return (
    <div className="hanger-block" aria-label={`Hanger block ${label}`}>
      {ROWS.map((row) => (
        <div className="hanger-row" key={`${label}-${row}`}>
          <div className="row-cells">
            {Array.from({ length: cols }).map((_, idx) => {
              const col = idx + 1;
              const key = `${label}-${row}-${col}`;
              const status = statusMap.get(key) || 'free';
              return (
                <div
                  key={key}
                  className={`slot ${status}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onClickSlot(label, row, col, status)}
                  aria-label={`${row}${col} ${status}`}
                  title={`${row}${col} ${status}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const RowLabels = ({ side = 'left' }) => (
  <div className={`row-labels ${side}`} aria-hidden>
    {ROWS.map((r) => (
      <div className="row-label" key={`${side}-${r}`}>{r}</div>
    ))}
  </div>
);

const HangerSpace = () => {
  const [slots, setSlots] = useState([]);
  const [bulk, setBulk] = useState({ block: 'B', status: 'empty_barrel' });
  const [bulkCols, setBulkCols] = useState({ block: 'B', fromCol: 1, toCol: 10, status: 'occupied' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusMap = useMemo(() => {
    const m = new Map();
    for (const slot of slots) {
      const cls = slot.status === 'vacant' ? 'free' : slot.status;
      m.set(`${slot.block}-${slot.row}-${slot.col}`, cls);
    }
    return m;
  }, [slots]);

  const occupiedCount = useMemo(() => {
    return slots.filter(slot => slot.status === 'occupied').length;
  }, [slots]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listHangerSpaces();
      setSlots(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyBulkByCols = async () => {
    try {
      const b = (bulkCols.block || 'B');
      const from = Math.max(1, Number(bulkCols.fromCol) || 1);
      const to = Math.max(from, Number(bulkCols.toCol) || from);
      const ids = slots.filter(s => s.block === b && s.col >= from && s.col <= to).map(s => s._id);
      if (!ids.length) return;
      const ok = window.confirm(`Set ${ids.length} slots in Block ${b}, Col ${from}-${to} to ${bulkCols.status}?`);
      if (!ok) return;
      await bulkSetHangerSpaceStatus(ids, bulkCols.status);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const applyBulk = async () => {
    try {
      const ids = slots.filter(s => s.block === (bulk.block || 'B')).map(s => s._id);
      if (!ids.length) return;
      const ok = window.confirm(`Set ${ids.length} slots in Block ${bulk.block} to ${bulk.status}?`);
      if (!ok) return;
      await bulkSetHangerSpaceStatus(ids, bulk.status);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };


  const ensureSeeded = useCallback(async () => {
    if (!slots || slots.length === 0) {
      await seedHangerGrid();
      await load();
    }
  }, [slots, load]);


  useEffect(() => { load(); }, []);
  useEffect(() => { ensureSeeded(); /* seed only once if empty */ }, [slots, ensureSeeded]);

  const handleClick = async (block, row, col, status) => {
    try {
      // find the slot id
      const slot = slots.find(s => s.block === block && s.row === row && s.col === col);
      if (!slot) return;
      const options = [
        { key: 'occupied', label: 'Occupied (Rubber Band)' },
        { key: 'empty_barrel', label: 'Empty Barrel' },
        { key: 'complete_bill', label: 'Complete Bill' },
        { key: 'vacant', label: 'Vacant' }
      ];
      const choice = window.prompt(`Set status for ${row}${col}:\n+1) Occupied (Rubber Band)\n+2) Empty Barrel\n+3) Complete Bill\n+4) Vacant
Enter 1-4`, '1');
      const idx = parseInt(choice, 10);
      if (!idx || idx < 1 || idx > 4) return;
      const selected = options[idx - 1].key;
      const product = selected === 'occupied' ? (window.prompt('Rubber band label (optional):', '') || '') : '';
      await setHangerSpaceStatus(slot._id, selected, product);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="hanger-page">
      {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <button className="btn" onClick={load} disabled={loading}>Reload</button>
        <button className="btn" onClick={async () => { await seedHangerGrid(); await load(); }} disabled={loading}>Seed Grid</button>
        <span style={{ color: '#e2e8f0' }}>Total: {slots.length} | Occupied: {occupiedCount}</span>
      </div>

      <div className="hanger-wrap">
        <RowLabels side="left" />
        <Block label="A" cols={10} statusMap={statusMap} onClickSlot={handleClick} />
        <div className="hanger-gap" />
        <Block label="B" cols={10} statusMap={statusMap} onClickSlot={handleClick} />
        <RowLabels side="right" />
      </div>

      <div className="dash-card" style={{ marginTop: 12, padding: 12, display: 'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
        <div style={{ fontWeight: 600 }}>Quick Fill</div>
        <label>Block
          <select value={bulk.block} onChange={(e)=>setBulk(s=>({ ...s, block: e.target.value }))} style={{ marginLeft: 6 }}>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>
        <label>Status
          <select value={bulk.status} onChange={(e)=>setBulk(s=>({ ...s, status: e.target.value }))} style={{ marginLeft: 6 }}>
            <option value="vacant">Free</option>
            <option value="empty_barrel">Empty Barrel</option>
            <option value="occupied">Rubber Band</option>
            <option value="complete_bill">Complete Bill</option>
          </select>
        </label>
        <button className="btn" onClick={applyBulk}>Apply</button>
      </div>

      <div className="dash-card" style={{ marginTop: 12, padding: 12, display: 'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
        <div style={{ fontWeight: 600 }}>Bulk by Columns</div>
        <label>Block
          <select value={bulkCols.block} onChange={(e)=>setBulkCols(s=>({ ...s, block: e.target.value }))} style={{ marginLeft: 6 }}>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>
        <label>From Col
          <input type="number" min={1} max={10} value={bulkCols.fromCol} onChange={(e)=>setBulkCols(s=>({ ...s, fromCol: e.target.value }))} style={{ width: 80, marginLeft: 6 }} />
        </label>
        <label>To Col
          <input type="number" min={1} max={10} value={bulkCols.toCol} onChange={(e)=>setBulkCols(s=>({ ...s, toCol: e.target.value }))} style={{ width: 80, marginLeft: 6 }} />
        </label>
        <label>Status
          <select value={bulkCols.status} onChange={(e)=>setBulkCols(s=>({ ...s, status: e.target.value }))} style={{ marginLeft: 6 }}>
            <option value="vacant">Free</option>
            <option value="empty_barrel">Empty Barrel</option>
            <option value="occupied">Rubber Band</option>
            <option value="complete_bill">Complete Bill</option>
          </select>
        </label>
        <button className="btn" onClick={applyBulkByCols}>Apply Range</button>
      </div>

      <div className="legend">
        <div className="legend-item"><span className="slot free" /> Free</div>
        <div className="legend-item"><span className="slot occupied" /> Rubber Band</div>
        <div className="legend-item"><span className="slot empty_barrel" /> Empty Barrel</div>
        <div className="legend-item"><span className="slot complete_bill" /> Complete Bill</div>
      </div>
    </div>
  );
};

export default HangerSpace;
