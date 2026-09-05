import { useEffect, useState } from 'react';
import { useSession } from './context/SessionContext.jsx';
import Header from './components/Header.jsx';
import CartButton from './components/CartButton.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';

export default function App() {
  const { me, error, beWaiter, switchRole, setCurrentOrder } = useSession();
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState('menu'); // 'menu' | 'order' | 'waiter'

  // Keep the view in step with the session (e.g. after a refresh mid-order).
  useEffect(() => {
    if (!me) return;
    if (me.role === 'waiter') setView('waiter');
    else if (me.currentOrderId) setView('order');
    else setView('menu');
  }, [me]);

  if (error && !me) return <CenteredNote>Could not reach the server. {error}</CenteredNote>;
  if (!me) return <CenteredNote>Loading…</CenteredNote>;

  const role = me.role === 'waiter' ? 'waiter' : 'customer';

  async function onRoleChange(next) {
    if (next === role) return;
    if (next === 'waiter') await beWaiter();
    else await switchRole();
  }

  function onPlaced(orderId) {
    setCurrentOrder(orderId);
    setCartOpen(false);
    setView('order');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        restaurant={me.restaurant}
        tableNumber={me.tableNumber}
        role={role}
        onRoleChange={onRoleChange}
        right={role === 'customer' ? <CartButton onClick={() => setCartOpen(true)} /> : null}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {role === 'waiter' && <CenteredNote>Waiter dashboard — next commit.</CenteredNote>}
        {role === 'customer' && view === 'menu' && <MenuPage />}
        {role === 'customer' && view === 'order' && me.currentOrderId && (
          <OrderTrackingPage
            orderId={me.currentOrderId}
            onNewOrder={() => { setCurrentOrder(null); setView('menu'); }}
          />
        )}
      </main>

      {role === 'customer' && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onPlaced={onPlaced} />}

      <footer className="mx-auto w-full max-w-6xl px-5 py-6 text-xs text-muted">
        Chowly · in-restaurant ordering · payments on this platform are simulated — no real money moves.
      </footer>
    </div>
  );
}

function CenteredNote({ children }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-center text-muted">
      <p className="max-w-sm">{children}</p>
    </div>
  );
}
