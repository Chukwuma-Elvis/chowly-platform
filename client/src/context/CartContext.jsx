import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // { [menuItemId]: { item, qty } }
  const [entries, setEntries] = useState({});

  const value = useMemo(() => {
    const lines = Object.values(entries).filter((e) => e.qty > 0);
    const count = lines.reduce((n, e) => n + e.qty, 0);
    const total = lines.reduce((n, e) => n + e.qty * Number(e.item.price_naira), 0);
    return {
      entries,
      lines,
      count,
      total,
      qtyOf: (id) => entries[id]?.qty || 0,
      add: (item) =>
        setEntries((s) => ({
          ...s,
          [item.id]: { item, qty: (s[item.id]?.qty || 0) + 1 },
        })),
      remove: (id) =>
        setEntries((s) => {
          const qty = (s[id]?.qty || 0) - 1;
          if (qty <= 0) {
            const { [id]: _, ...rest } = s;
            return rest;
          }
          return { ...s, [id]: { ...s[id], qty } };
        }),
      clear: () => setEntries({}),
    };
  }, [entries]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
