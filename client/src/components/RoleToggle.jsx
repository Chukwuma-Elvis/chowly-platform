// The "simple switch" the brief asks for - no login, just Customer vs Waiter.
export default function RoleToggle({ value, onChange }) {
  const options = [
    ['customer', 'Customer'],
    ['waiter', 'Waiter'],
  ];
  return (
    <div className="inline-flex rounded-lg border border-sand bg-cream p-0.5">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === key ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
