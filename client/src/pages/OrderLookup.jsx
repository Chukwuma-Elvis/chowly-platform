import { useState } from 'react';
import { useSession } from '../context/SessionContext.jsx';

export default function OrderLookup({ onFound, onBack }) {
  const { me, lookupOrder } = useSession();
  const [name, setName] = useState(me?.customerName || '');
  const [tableNumber, setTableNumber] = useState(me?.tableNumber || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const orderId = await lookupOrder({ name: name.trim(), tableNumber: tableNumber.trim() });
      onFound(orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl text-ink">Check your order</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the name and table number you used when you ordered, and we&rsquo;ll bring up
        its status and the time left.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-3 p-4">
        <label className="block text-xs text-muted">
          Name on the order
          <input
            className="field mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amarachi"
            required
          />
        </label>
        <label className="block text-xs text-muted">
          Table number
          <input
            className="field mt-1"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g. T05"
            required
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Looking…' : 'Find my order'}
        </button>
      </form>

      <button type="button" className="mt-4 text-sm text-muted underline" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
