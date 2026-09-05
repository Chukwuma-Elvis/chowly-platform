export default function PrepTeam({ order }) {
  const assigned = Boolean(order.waiter_name);
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-medium text-ink">Who's handling this</div>
      {assigned ? (
        <dl className="grid grid-cols-3 gap-2 text-sm">
          {[
            ['Waiter', order.waiter_name],
            ['Chef', order.chef_name],
            ['Bartender', order.bartender_name],
          ].map(([label, name]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
              <dd className="text-ink">{name || '—'}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted">Waiting for a waiter to pick up the order.</p>
      )}
    </div>
  );
}
