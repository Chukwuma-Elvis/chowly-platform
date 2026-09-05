import { useEffect, useState } from 'react';
import { minutesLabel, clockTime } from '../lib/format.js';

// While the order is active, a live countdown to the estimated ready time.
// Once the estimate is blown it flips to "running late"; after serving it
// shows the actual wait.
export default function WaitCountdown({ order }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = order.status === 'pending' || order.status === 'preparing';
  const placed = new Date(order.order_datetime).getTime();
  const expectedReady = placed + order.estimated_wait_minutes * 60000;
  const remainingMs = expectedReady - now;
  const late = active && remainingMs <= 0;
  const minsLate = Math.round(-remainingMs / 60000);

  let big;
  let sub;
  if (active && !late) {
    const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    big = `${mm}:${String(ss).padStart(2, '0')}`;
    sub = `Expected ready around ${clockTime(expectedReady)} · estimate ${minutesLabel(order.estimated_wait_minutes)}`;
  } else if (active && late) {
    big = 'Running late';
    sub =
      minsLate < 180
        ? `About ${minsLate} min past the ${minutesLabel(order.estimated_wait_minutes)} estimate`
        : `Past the ${minutesLabel(order.estimated_wait_minutes)} estimate`;
  } else if (order.actual_wait_minutes != null) {
    big = `Served in ${minutesLabel(order.actual_wait_minutes)}`;
    sub =
      order.actual_wait_minutes > order.estimated_wait_minutes
        ? `Longer than the ${minutesLabel(order.estimated_wait_minutes)} estimate`
        : `Within the ${minutesLabel(order.estimated_wait_minutes)} estimate`;
  } else {
    big = minutesLabel(order.estimated_wait_minutes);
    sub = null;
  }

  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">
        {active && !late ? 'Time remaining' : 'Estimated wait'}
      </div>
      <div
        className={`mt-0.5 font-serif text-3xl tabular-nums ${late ? 'text-clay-dark' : 'text-ink'}`}
      >
        {big}
      </div>
      {sub && <div className={`mt-1 text-sm ${late ? 'text-clay-dark' : 'text-muted'}`}>{sub}</div>}
    </div>
  );
}
