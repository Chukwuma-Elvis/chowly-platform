import { STATUS_STYLE } from '../lib/format.js';

export default function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        STATUS_STYLE[status] || 'bg-sand text-muted'
      }`}
    >
      {status}
    </span>
  );
}
