import { useSession } from './context/SessionContext.jsx';
import Header from './components/Header.jsx';

export default function App() {
  const { me, error, beWaiter, switchRole } = useSession();

  if (error && !me) {
    return <CenteredNote>Could not reach the server. {error}</CenteredNote>;
  }
  if (!me) {
    return <CenteredNote>Loading…</CenteredNote>;
  }

  const role = me.role === 'waiter' ? 'waiter' : 'customer';

  async function onRoleChange(next) {
    if (next === role) return;
    if (next === 'waiter') await beWaiter();
    else await switchRole(); // leave the waiter view -> back to customer/browse
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        restaurant={me.restaurant}
        tableNumber={me.tableNumber}
        role={role}
        onRoleChange={onRoleChange}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {role === 'waiter' ? (
          <CenteredNote>Waiter dashboard — next commit.</CenteredNote>
        ) : (
          <CenteredNote>Menu — next commit.</CenteredNote>
        )}
      </main>
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
