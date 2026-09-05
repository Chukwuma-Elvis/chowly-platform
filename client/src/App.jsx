import { useEffect, useRef, useState } from 'react';
import { useSession } from './context/SessionContext.jsx';
import Header from './components/Header.jsx';
import CartButton from './components/CartButton.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import LandingPage from './pages/LandingPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrderLookup from './pages/OrderLookup.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';
import WaiterDashboard from './pages/WaiterDashboard.jsx';

export default function App() {
  const { me, error, setRole, resetVisit, setCurrentOrder } = useSession();
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState('landing'); // 'landing' | 'lookup' | 'menu' | 'order' | 'waiter'

  const initialised = useRef(false);
  const prevRole = useRef(undefined);
  const pendingView = useRef(null); // an explicit navigation waiting on a session change

  // The view is authoritative once set. The session only steers it on the
  // first load and whenever the role actually changes (toggle, reset) - unless
  // an explicit navigation (e.g. the logo) has asked for a specific view.
  useEffect(() => {
    if (!me) return;
    const roleChanged = prevRole.current !== undefined && prevRole.current !== me.role;
    prevRole.current = me.role;

    const start = () => {
      if (me.role === 'waiter') return 'waiter';
      if (me.currentOrderId) return 'order';
      if (me.tableNumber) return 'menu';
      return 'landing';
    };

    if (pendingView.current) {
      setView(pendingView.current);
      pendingView.current = null;
    } else if (!initialised.current) {
      initialised.current = true;
      setView(start());
    } else if (roleChanged) {
      setView(start());
    }
  }, [me]);

  if (error && !me) return <CenteredNote>Could not reach the server. {error}</CenteredNote>;
  if (!me) return <CenteredNote>Loading…</CenteredNote>;

  const role = me.role === 'waiter' ? 'waiter' : 'customer';

  async function onRoleChange(next) {
    if (next === role) return;
    await setRole(next);
  }

  async function goHome() {
    if (me.role === 'waiter') {
      pendingView.current = 'landing'; // survive the role-change re-sync
      await setRole('customer');
    } else {
      setView('landing');
    }
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
        onHome={goHome}
        right={
          role === 'customer' && (view === 'menu' || view === 'order')
            ? <CartButton onClick={() => setCartOpen(true)} />
            : null
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {role === 'waiter' && <WaiterDashboard />}
        {role === 'customer' && view === 'landing' && (
          <LandingPage
            restaurant={me.restaurant}
            tableNumber={me.tableNumber}
            onEnter={() => setView('menu')}
            onCheckOrder={() => setView('lookup')}
          />
        )}
        {role === 'customer' && view === 'lookup' && (
          <OrderLookup
            onFound={(orderId) => { setCurrentOrder(orderId); setView('order'); }}
            onBack={() => setView('landing')}
          />
        )}
        {role === 'customer' && view === 'menu' && <MenuPage />}
        {role === 'customer' && view === 'order' && me.currentOrderId && (
          <OrderTrackingPage
            orderId={me.currentOrderId}
            onNewOrder={async () => { await resetVisit(); setView('landing'); }}
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
