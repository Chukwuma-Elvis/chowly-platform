import Logo from './Logo.jsx';
import RoleToggle from './RoleToggle.jsx';

export default function Header({ restaurant, tableNumber, role, onRoleChange, right }) {
  return (
    <header className="sticky top-0 z-20 border-b border-sand bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5">
        <Logo />

        <div className="hidden text-center sm:block">
          <div className="font-serif text-lg text-ink">{restaurant?.name || 'Chowly'}</div>
          <div className="text-xs text-muted">
            {tableNumber ? `Table ${tableNumber}` : 'Welcome'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <RoleToggle value={role} onChange={onRoleChange} />
          {right}
        </div>
      </div>
    </header>
  );
}
