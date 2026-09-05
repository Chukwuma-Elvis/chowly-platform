import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { naira, clockTime } from '../lib/format.js';
import { CATEGORY_LABEL } from '../lib/categories.js';
import StatusBadge from '../components/StatusBadge.jsx';
import WaitCountdown from '../components/WaitCountdown.jsx';
import PrepTeam from '../components/PrepTeam.jsx';

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

  if (error && !detail) return <p className="text-sm text-red-700">{error}</p>;
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

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 text-center font-medium">Qty</th>
              <th className="px-4 py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-sand">
                <td className="px-4 py-2">
                  {i.name}
                  <span className="ml-1 text-xs text-muted">({CATEGORY_LABEL[i.category]})</span>
                </td>
                <td className="px-4 py-2 text-center">{i.quantity}</td>
                <td className="px-4 py-2 text-right">{naira(i.unit_price_naira)}</td>
                <td className="px-4 py-2 text-right">{naira(i.subtotal_naira)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-sand font-semibold">
              <td className="px-4 py-2" colSpan={3}>Total</td>
              <td className="px-4 py-2 text-right">{naira(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <PrepTeam order={order} />

      <div className="pt-2">
        <button type="button" className="btn-ghost" onClick={onNewOrder}>
          ← Back to the menu
        </button>
      </div>
    </div>
  );
}
