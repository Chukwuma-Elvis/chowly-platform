import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { TABLES } from '../lib/tables.js';

// markTaken: grey out tables that already have an order in progress (checkout).
// Left off for the order-lookup form, where the caller's table is likely taken.
export default function TableSelect({ value, onChange, markTaken = false }) {
  const [taken, setTaken] = useState([]);

  useEffect(() => {
    if (!markTaken) return;
    api('/tables').then((d) => setTaken(d.taken || [])).catch(() => {});
  }, [markTaken]);

  return (
    <select className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose your table…</option>
      {TABLES.map((t) => {
        const isTaken = markTaken && taken.includes(t.value);
        return (
          <option key={t.value} value={t.value} disabled={isTaken}>
            {t.label}{isTaken ? ' — taken' : ''}
          </option>
        );
      })}
    </select>
  );
}
