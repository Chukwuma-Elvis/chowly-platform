import { useEffect, useState } from 'react';
import { minutesLabel, clockTime } from '../lib/format.js';

// Shows the estimated wait, and - while the order is still active - a live
// "expected ready around HH:MM" that turns into "running late" once the
// estimate is blown. After serving it shows the actual wait instead.
export default function WaitCountdown({ order }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  const active = order.status === 'pending' || order.status === 'preparing';
  const placed = new Date(order.order_datetime);
  const expectedReady = new Date(placed.getTime() + order.estimated_wait_minutes * 60000);
  const late = active && Date.now() > expectedReady.getTime();
  const minsLate = Math.round((Date.now() - expectedReady.getTime()) / 60000);

  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">Estimated wait</div>
      <div className="mt-0.5 text-2xl text-ink">{minutesLabel(order.estimated_wait_minutes)}</div>

      {active ? (
        <div className={`mt-1 text-sm ${late ? 'text-clay-dark' : 'text-muted'}`}>
          {late
            ? `Running late — about ${minsLate} min past the estimate`
            : `Expected ready around ${clockTime(expectedReady)}`}
        </div>
      ) : order.actual_wait_minutes != null ? (
        <div className="mt-1 text-sm text-muted">
          Served in {minutesLabel(order.actual_wait_minutes)}
          {order.actual_wait_minutes > order.estimated_wait_minutes ? ' — longer than estimated' : ''}
        </div>
      ) : null}
    </div>
  );
}
