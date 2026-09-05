import { useState } from 'react';
import { api } from '../api.js';
import { naira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useSession } from '../context/SessionContext.jsx';
import TableSelect from './TableSelect.jsx';

export default function CartDrawer({ open, onClose, onPlaced }) {
  const { lines, total, count, add, remove, clear } = useCart();
  const { me, beCustomer } = useSession();

  const identified = me?.role === 'customer' && !!me?.tableNumber;
  const [step, setStep] = useState('cart'); // 'cart' | 'details'
  const [name, setName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      if (!identified) {
        if (!tableNumber) throw new Error('Please choose your table.');
        await beCustomer({ name: name.trim(), tableNumber: tableNumber.trim() });
      }
      const items = lines.map((l) => ({ menuItemId: l.item.id, qty: l.qty }));
      const { orderId } = await api('/orders', { method: 'POST', body: { items } });
      clear();
      setStep('cart');
      onPlaced(orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function primaryAction() {
    if (step === 'cart' && !identified) return setStep('details');
    return placeOrder();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/30 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col bg-cream shadow-xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 className="text-xl text-ink">Your order</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {count === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              Nothing here yet. Add a dish or two from the menu.
            </p>
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.item.id} className="card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">{l.item.name}</div>
                      <div className="text-xs text-muted">{naira(l.item.price_naira)} each</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-ink">
                      {naira(l.qty * l.item.price_naira)}
                    </div>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-3 rounded-lg border border-sand bg-white px-2 py-1">
                    <button onClick={() => remove(l.item.id)} className="px-2 text-lg text-clay" aria-label="Remove one">−</button>
                    <span className="w-5 text-center text-sm">{l.qty}</span>
                    <button onClick={() => add(l.item)} className="px-2 text-lg text-clay" aria-label="Add one">+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {step === 'details' && !identified && (
            <div className="mt-5 space-y-3">
              <div className="text-sm font-medium text-ink">Where are you sitting?</div>
              <label className="block text-xs text-muted">
                Your name (optional)
                <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amarachi" />
              </label>
              <label className="block text-xs text-muted">
                Table
                <TableSelect value={tableNumber} onChange={setTableNumber} />
              </label>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="border-t border-sand px-5 py-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted">Total</span>
            <span className="text-lg font-semibold text-ink">{naira(total)}</span>
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={count === 0 || busy}
            onClick={primaryAction}
          >
            {busy
              ? 'Placing…'
              : step === 'cart' && !identified
                ? 'Continue'
                : 'Place order'}
          </button>
          {identified && (
            <p className="mt-2 text-center text-xs text-muted">Table {me.tableNumber}</p>
          )}
        </div>
      </aside>
    </>
  );
}
