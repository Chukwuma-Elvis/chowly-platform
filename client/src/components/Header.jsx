import Logo from './Logo.jsx';
import RoleToggle from './RoleToggle.jsx';

export default function Header({ restaurant, tableNumber, role, onRoleChange, onHome, right, dark }) {
  return (
    <header
      className={`sticky top-0 z-20 ${
        dark ? 'border-transparent bg-transparent' : 'border-b border-sand bg-cream/90 backdrop-blur'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5">
        {onHome ? (
          <button
            type="button"
            onClick={onHome}
            className="rounded-md transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            aria-label="Chowly home"
          >
            <Logo dark={dark} />
          </button>
        ) : (
          <Logo dark={dark} />
        )}

        <div className="hidden text-center sm:block">
          <div className={`font-serif text-lg ${dark ? 'text-cream' : 'text-ink'}`}>
            {restaurant?.name || 'Chowly'}
          </div>
          <div className={`text-xs ${dark ? 'text-cream/70' : 'text-muted'}`}>
            {tableNumber ? `Table ${tableNumber}` : 'Welcome'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <RoleToggle value={role} onChange={onRoleChange} dark={dark} />
          {right}
        </div>
      </div>
    </header>
  );
}
