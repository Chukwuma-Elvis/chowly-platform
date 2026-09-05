import { TABLES } from '../lib/tables.js';

export default function TableSelect({ value, onChange }) {
  return (
    <select className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose your table…</option>
      {TABLES.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  );
}
