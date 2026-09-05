import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { naira, clockTime } from '../lib/format.js';
import { CATEGORY_LABEL } from '../lib/categories.js';
import StatusBadge from '../components/StatusBadge.jsx';
import WaitCountdown from '../components/WaitCountdown.jsx';
import PrepTeam from '../components/PrepTeam.jsx';
import { ComplaintPanel, RatingPanel, PaymentPanel } from '../components/OrderPanels.jsx';

export default function OrderTrackingPage({ orderId, onNewOrder }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api(`/orders/${orderId}`)
      .then((d) => { setDetail(d); setError(null); })
      .catch((err) => setError(err.message));
  }, [orderId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (error && !detail) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="text-sm text-muted">We couldn't load that order ({error}).</p>
        <button type="button" className="btn-ghost" onClick={onNewOrder}>Start a new order</button>
      </div>
    );
  }
  if (!detail) return <p className="text-muted">Loading your order…</p>;

  const { order, items, total } = detail;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Order #{order.id}</h1>
          <p className="text-sm text-muted">
            Table {order.table_number} · placed {clockTime(order.order_datetime)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <WaitCountdown order={order} />

      <div className="card divide-y divide-sand">
        {items.map((i) => (
          <div key={i.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
            <div className="min-w-0">
              <div className="text-ink">{i.name}</div>
              <div className="text-xs text-muted">
                {i.quantity} × {naira(i.unit_price_naira)} · {CATEGORY_LABEL[i.category]}
              </div>
            </div>
            <div className="shrink-0 font-medium">{naira(i.subtotal_naira)}</div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold">
          <span>Total</span>
          <span>{naira(total)}</span>
        </div>
      </div>

      <PrepTeam order={order} />

      <PaymentPanel detail={detail} total={total} />
      <ComplaintPanel detail={detail} onChange={load} />
      <RatingPanel detail={detail} onChange={load} />

      <div className="pt-2">
        <button type="button" className="btn-ghost" onClick={onNewOrder}>
          Start a new order
        </button>
      </div>
    </div>
  );
}
