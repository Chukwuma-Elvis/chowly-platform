import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES } from '../lib/categories.js';
import { useCart } from '../context/CartContext.jsx';
import CategorySidebar from '../components/CategorySidebar.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState('all');
  const [error, setError] = useState(null);
  const { qtyOf, add, remove } = useCart();

  useEffect(() => {
    api('/menu')
      .then((d) => setItems(d.items))
      .catch((err) => setError(err.message));
  }, []);

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const cat of CATEGORIES) c[cat.key] = items.filter((i) => i.category === cat.key).length;
    return c;
  }, [items]);

  const shown = active === 'all' ? items : items.filter((i) => i.category === active);

  return (
    <div className="grid gap-6 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-8">
      <aside className="min-w-0">
        <CategorySidebar counts={counts} active={active} onSelect={setActive} />
      </aside>

      <section className="min-w-0">
        <div className="mb-1 flex items-baseline justify-between">
          <h1 className="text-2xl text-ink">Good evening — what would you like tonight?</h1>
        </div>
        <p className="mb-6 text-sm text-muted">
          Every dish is prepared fresh to order. {shown.length} on the menu
          {active !== 'all' ? ' in this section' : ''}.
        </p>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={qtyOf(item.id)}
              onAdd={() => add(item)}
              onRemove={() => remove(item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
