// The "simple switch" the brief asks for - no login, just Customer vs Waiter.
export default function RoleToggle({ value, onChange, dark }) {
  const options = [
    ['customer', 'Customer'],
    ['waiter', 'Waiter'],
  ];
  return (
    <div
      className={`inline-flex rounded-lg p-0.5 ${
        dark ? 'border border-cream/20 bg-cream/10 backdrop-blur' : 'border border-sand bg-cream'
      }`}
    >
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === key
              ? dark
                ? 'bg-cream text-ink shadow-sm'
                : 'bg-white text-ink shadow-sm'
              : dark
                ? 'text-cream/70 hover:text-cream'
                : 'text-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
