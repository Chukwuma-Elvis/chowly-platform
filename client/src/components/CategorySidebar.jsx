import { CATEGORIES } from '../lib/categories.js';

export default function CategorySidebar({ counts, active, onSelect }) {
  const rows = [
    { key: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
  ];
  return (
    <nav className="sm:sticky sm:top-24">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        Browse
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-1 sm:block sm:space-y-1 sm:overflow-visible sm:pb-0">
        {rows.map((r) => {
          const count = r.key === 'all' ? counts.all : counts[r.key] || 0;
          const isActive = active === r.key;
          return (
            <li key={r.key} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(r.key)}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-clay-tint font-medium text-clay-dark' : 'text-ink hover:bg-sand/60'
                }`}
              >
                <span>{r.label}</span>
                <span
                  className={`rounded-full px-2 text-xs ${
                    isActive ? 'bg-clay text-white' : 'bg-sand text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
