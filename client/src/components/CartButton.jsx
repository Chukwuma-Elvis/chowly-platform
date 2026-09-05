import { useCart } from '../context/CartContext.jsx';

export default function CartButton({ onClick }) {
  const { count } = useCart();
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-lg border border-sand bg-surface p-2 text-ink transition hover:border-clay hover:text-clay"
      aria-label={`Open order (${count} item${count === 1 ? '' : 's'})`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
        <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-clay px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
