import { naira, clockTime, minutesLabel } from '../lib/format.js';
import { CATEGORY_LABEL } from '../lib/categories.js';
import Stars from './Stars.jsx';
import PretendBadge from './PretendBadge.jsx';

// A read-only, full picture of one order. Used on the waiter board when a
// completed card is opened.
export default function OrderSummary({ detail }) {
  const { order, items, payment, complaint, rating, total } = detail;

  return (
    <div className="mt-3 space-y-4 border-t border-sand pt-3 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <Field label="Placed" value={clockTime(order.order_datetime)} />
        {order.served_at && <Field label="Served" value={clockTime(order.served_at)} />}
        {payment && <Field label="Paid" value={clockTime(payment.paid_at)} />}
        <Field label="Waiter" value={order.waiter_name || '—'} />
        <Field label="Chef" value={order.chef_name || '—'} />
        <Field label="Bartender" value={order.bartender_name || '—'} />
        <Field label="Estimated wait" value={minutesLabel(order.estimated_wait_minutes)} />
        {order.actual_wait_minutes != null && (
          <Field
            label="Actual wait"
            value={order.actual_wait_minutes <= 6 * 60 ? minutesLabel(order.actual_wait_minutes) : '—'}
          />
        )}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem]">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-1 font-medium">Item</th>
              <th className="py-1 text-center font-medium">Qty</th>
              <th className="py-1 text-right font-medium">Unit</th>
              <th className="py-1 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-sand/70">
                <td className="py-1">
                  {i.name} <span className="text-xs text-muted">({CATEGORY_LABEL[i.category]})</span>
                </td>
                <td className="py-1 text-center">{i.quantity}</td>
                <td className="py-1 text-right">{naira(i.unit_price_naira)}</td>
                <td className="py-1 text-right">{naira(i.subtotal_naira)}</td>
              </tr>
            ))}
            <tr className="border-t border-sand font-semibold">
              <td className="py-1" colSpan={3}>Total</td>
              <td className="py-1 text-right">{naira(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-cream/70 p-3">
        <div className="text-xs uppercase tracking-wide text-muted">Payment</div>
        {payment ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-emerald-700">{naira(payment.amount_naira)}</span>
            <span className="capitalize text-ink">· {payment.method}</span>
            <span className="text-muted">· {clockTime(payment.paid_at)}</span>
            {payment.is_pretend && <PretendBadge />}
          </div>
        ) : (
          <div className="mt-1 text-muted">Not paid yet.</div>
        )}
      </div>

      {complaint && (
        <div className="rounded-lg border border-clay-soft bg-clay-tint p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-clay-dark">Complaint</span>
            <span className="text-xs font-semibold uppercase text-muted">
              {complaint.resolution_status}
            </span>
          </div>
          <p className="mt-1 text-ink">“{complaint.description}”</p>
          {complaint.resolved_at && (
            <p className="mt-1 text-xs text-muted">Resolved {clockTime(complaint.resolved_at)}.</p>
          )}
        </div>
      )}

      {rating && (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Rating</span>
          <Stars value={rating.rating_value} />
          {rating.comment && <span className="text-muted">“{rating.comment}”</span>}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
