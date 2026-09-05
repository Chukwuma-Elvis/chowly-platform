import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { naira, minutesLabel } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderSummary from '../components/OrderSummary.jsx';

const PAYMENT_METHODS = ['cash', 'card', 'transfer'];

export default function WaiterDashboard() {
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState({ waiters: [], chefs: [], bartenders: [] });
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api('/waiter/orders')
      .then((d) => { setOrders(d.orders); setError(null); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api('/staff').then(setStaff).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl text-ink">Order board</h1>
      <p className="mb-6 text-sm text-muted">
        Assign a waiter, chef and bartender to each new order, mark it served when it
        goes out, then take payment. Complaints show here in red.
      </p>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {orders.map((o) => (
          <OrderRow key={o.id} order={o} staff={staff} onChange={load} />
        ))}
        {orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
      </div>
    </div>
  );
}

function OrderRow({ order: o, staff, onChange }) {
  const [assign, setAssign] = useState({ waiterId: '', chefId: '', bartenderId: '' });
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const completed = o.status === 'paid';

  function toggleSummary() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      setDetailError(null);
      api(`/orders/${o.id}`).then(setDetail).catch((err) => setDetailError(err.message));
    }
  }

  async function call(path, body) {
    setBusy(true);
    setError(null);
    try {
      await api(path, { method: 'POST', body });
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const headerProps = completed
    ? {
        onClick: toggleSummary,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSummary(); }
        },
        'aria-expanded': open,
        className: '-m-1 flex flex-wrap items-center justify-between gap-2 rounded-lg p-1 cursor-pointer hover:bg-cream/60',
      }
    : { className: 'flex flex-wrap items-center justify-between gap-2' };

  return (
    <div className="card p-4">
      <div {...headerProps}>
        <div>
          <span className="font-medium text-ink">Order #{o.id}</span>
          <span className="ml-2 text-sm text-muted">Table {o.table_number} · {o.customer_name}</span>
        </div>
        <div className="flex items-center gap-2">
          {o.open_complaints > 0 && (
            <span className="rounded-full bg-clay-tint px-2 py-1 text-xs font-semibold text-clay-dark">
              complaint
            </span>
          )}
          <StatusBadge status={o.status} />
          {completed && <span className="text-muted">{open ? '▴' : '▾'}</span>}
        </div>
      </div>

      <div className="mt-1 text-sm text-muted">
        {naira(o.total)} · est. {minutesLabel(o.estimated_wait_minutes)}
        {o.actual_wait_minutes != null &&
          o.actual_wait_minutes <= 6 * 60 &&
          ` · served in ${minutesLabel(o.actual_wait_minutes)}`}
      </div>

      {!(completed && open) && (
        <ul className="mt-3 space-y-1 rounded-lg bg-cream/70 p-3 text-sm">
          {(o.items || []).map((it, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="text-ink">
                <span className="font-medium">{it.quantity}×</span> {it.name}
              </span>
              <span className="text-muted">{naira(it.subtotal_naira)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-sand pt-1 font-medium">
            <span>Total</span>
            <span>{naira(o.total)}</span>
          </li>
        </ul>
      )}

      {completed && (
        <div className="mt-3">
          {!open && (
            <button type="button" onClick={toggleSummary} className="text-xs text-clay hover:text-clay-dark">
              {o.payment_method
                ? `Paid by ${o.payment_method} · view full summary`
                : 'View full summary'}
            </button>
          )}
          {open && detailError && <p className="text-sm text-red-700">{detailError}</p>}
          {open && !detail && !detailError && <p className="text-sm text-muted">Loading…</p>}
          {open && detail && <OrderSummary detail={detail} />}
        </div>
      )}

      {o.open_complaints > 0 && o.open_complaint_text && (
        <div className="mt-3 rounded-lg border border-clay-soft bg-clay-tint p-3 text-sm">
          <p className="text-ink">“{o.open_complaint_text}”</p>
          <button
            className="btn-ghost mt-2"
            disabled={busy}
            onClick={() => call(`/complaints/${o.open_complaint_id}/resolve`, { waiterId: o.waiter_id || undefined })}
          >
            Mark complaint resolved
          </button>
        </div>
      )}

      {o.status === 'pending' && (
        <div className="mt-3 border-t border-sand pt-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Select label="Waiter" options={staff.waiters}
              value={assign.waiterId} onChange={(v) => setAssign((a) => ({ ...a, waiterId: v }))} />
            <Select label="Chef" options={staff.chefs}
              value={assign.chefId} onChange={(v) => setAssign((a) => ({ ...a, chefId: v }))} />
            <Select label="Bartender" options={staff.bartenders}
              value={assign.bartenderId} onChange={(v) => setAssign((a) => ({ ...a, bartenderId: v }))} />
          </div>
          <button
            className="btn-primary mt-3"
            disabled={busy || !assign.waiterId || !assign.chefId || !assign.bartenderId}
            onClick={() => call(`/orders/${o.id}/assign`, assign)}
          >
            Confirm assignment
          </button>
        </div>
      )}

      {o.status === 'preparing' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sand pt-3 text-sm text-muted">
          <span>Waiter {o.waiter_name} · Chef {o.chef_name} · Bartender {o.bartender_name}</span>
          <button className="btn-primary" disabled={busy} onClick={() => call(`/orders/${o.id}/serve`)}>
            Mark served
          </button>
        </div>
      )}

      {o.status === 'served' && (
        <div className="mt-3 border-t border-sand pt-3 text-sm text-muted">
          <div>Waiter {o.waiter_name} · Chef {o.chef_name} · Bartender {o.bartender_name}</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted">Paid by</span>
            <div className="inline-flex rounded-lg border border-sand bg-cream p-0.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                    method === m ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => call(`/orders/${o.id}/pay`, { method })}
            >
              {busy ? 'Recording…' : `Take ${naira(o.total)} payment`}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Records a pretend payment against the order and marks it paid — no real money moves.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <select className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}{o.specialty ? ` · ${o.specialty}` : ''}</option>
        ))}
      </select>
    </label>
  );
}
