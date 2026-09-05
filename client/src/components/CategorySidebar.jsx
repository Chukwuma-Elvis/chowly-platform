import { CATEGORIES } from '../lib/categories.js';

export default function CategorySidebar({ counts, active, onSelect }) {
  const rows = [
    { key: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
  ];
  return (
    <nav className="sm:sticky sm:top-24">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted sm:mb-3">
        Browse
      </div>
      {/* mobile: a wrapping row of compact pills; sm+: a vertical list */}
      <ul className="flex flex-wrap gap-2 sm:block sm:space-y-1">
        {rows.map((r) => {
          const count = r.key === 'all' ? counts.all : counts[r.key] || 0;
          const isActive = active === r.key;
          return (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => onSelect(r.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition
                            sm:w-full sm:justify-between sm:rounded-lg sm:py-2 ${
                              isActive
                                ? 'bg-clay-tint font-medium text-clay-dark'
                                : 'bg-sand/50 text-ink hover:bg-sand sm:bg-transparent sm:hover:bg-sand/60'
                            }`}
              >
                <span>{r.label}</span>
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    isActive ? 'bg-clay text-white' : 'bg-white text-muted sm:bg-sand'
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
