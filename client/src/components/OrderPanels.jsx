import { useState } from 'react';
import { api } from '../api.js';
import { naira, clockTime } from '../lib/format.js';
import Stars from './Stars.jsx';
import PretendBadge from './PretendBadge.jsx';

const ACTIVE = new Set(['pending', 'preparing']);

export function ComplaintPanel({ detail, onChange }) {
  const { order, complaint } = detail;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (complaint) {
    const resolved = complaint.resolution_status === 'resolved';
    return (
      <div className={`card p-4 ${resolved ? '' : 'border-clay-soft bg-clay-tint'}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-ink">Complaint</div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {complaint.resolution_status}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink">{complaint.description}</p>
        {resolved && (
          <p className="mt-1 text-xs text-muted">Resolved by the floor team at {clockTime(complaint.resolved_at)}.</p>
        )}
      </div>
    );
  }

  if (!ACTIVE.has(order.status)) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/orders/${order.id}/complaint`, { method: 'POST', body: { description: text.trim() } });
      setText('');
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="text-sm font-medium text-ink">Taking too long?</div>
      <p className="mt-0.5 text-xs text-muted">Tell the floor team — it goes straight onto this order.</p>
      <textarea
        className="field mt-2"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. We've been waiting 40 minutes"
        required
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <button className="btn-ghost mt-2" disabled={busy}>
        {busy ? 'Sending…' : 'Submit complaint'}
      </button>
    </form>
  );
}

export function RatingPanel({ detail, onChange }) {
  const { order, rating } = detail;
  const [value, setValue] = useState(rating?.rating_value || 0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canRate = ['served', 'paid'].includes(order.status) || Boolean(rating);
  if (!canRate) return null;

  if (rating) {
    return (
      <div className="card p-4">
        <div className="text-sm font-medium text-ink">Your rating</div>
        <div className="mt-1 flex items-center gap-2">
          <Stars value={rating.rating_value} />
          {rating.comment && <span className="text-sm text-muted">“{rating.comment}”</span>}
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (!value) { setError('Pick a star rating.'); return; }
    setBusy(true);
    setError(null);
    try {
      await api(`/orders/${order.id}/rating`, {
        method: 'POST',
        body: { ratingValue: value, comment: comment.trim() },
      });
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="text-sm font-medium text-ink">Rate this order</div>
      <div className="mt-2"><Stars value={value} onPick={setValue} /></div>
      <input
        className="field mt-2"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)"
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <button className="btn-ghost mt-2" disabled={busy}>
        {busy ? 'Saving…' : 'Submit rating'}
      </button>
    </form>
  );
}

// Customer-side: payment is taken by the waiter, so this panel only reports.
export function PaymentPanel({ detail, total }) {
  const { order, payment } = detail;

  if (payment) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="font-semibold text-emerald-700">Paid {naira(payment.amount_naira)}</div>
          <div className="text-xs capitalize text-muted">
            {payment.method} · {clockTime(payment.paid_at)}
          </div>
        </div>
        <PretendBadge />
      </div>
    );
  }

  if (order.status !== 'served') return null;

  return (
    <div className="card p-4 text-sm text-ink">
      Your order comes to <span className="font-semibold">{naira(total)}</span>. Your waiter
      will take payment at the table before you leave.
    </div>
  );
}
