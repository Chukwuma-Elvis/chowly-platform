import { naira, minutesLabel } from '../lib/format.js';
import { CATEGORY_BAND, CATEGORY_LABEL } from '../lib/categories.js';

export default function MenuItemCard({ item, qty, onAdd, onRemove }) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className={`relative h-28 ${CATEGORY_BAND[item.category] || 'bg-sand'}`}>
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white">
          {minutesLabel(item.avg_prep_minutes)}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-sm font-semibold text-ink">
          {naira(item.price_naira)}
        </span>
        <span className="absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.18em] text-ink/50">
          {CATEGORY_LABEL[item.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg text-ink">{item.name}</h3>
        {item.description && (
          <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>
        )}

        <div className="mt-4">
          {qty > 0 ? (
            <div className="flex items-center justify-between rounded-lg border border-sand bg-white px-2 py-1.5">
              <button type="button" onClick={onRemove} className="px-3 text-lg text-clay" aria-label="Remove one">
                −
              </button>
              <span className="text-sm font-medium">{qty} in order</span>
              <button type="button" onClick={onAdd} className="px-3 text-lg text-clay" aria-label="Add one">
                +
              </button>
            </div>
          ) : (
            <button type="button" onClick={onAdd} className="btn-primary w-full">
              + Add to Order
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
