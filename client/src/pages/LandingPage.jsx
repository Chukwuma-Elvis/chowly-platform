export default function LandingPage({ restaurant, tableNumber, onEnter, onCheckOrder }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center py-10 text-center">
      <svg width="64" height="64" viewBox="0 0 32 32" aria-hidden="true" className="mb-6">
        <circle cx="16" cy="16" r="15" fill="none" stroke="#C0563B" strokeWidth="1.25" />
        <path
          d="M16 6c3 3.6 4.8 6.5 4.8 9.8A4.8 4.8 0 0 1 16 20.6a4.8 4.8 0 0 1-4.8-4.8C11.2 12.5 13 9.6 16 6Z"
          fill="#C0563B"
        />
        <path d="M16 20.6V27" stroke="#C0563B" strokeWidth="1.25" strokeLinecap="round" />
      </svg>

      <div className="text-[11px] uppercase tracking-[0.35em] text-muted">Welcome to</div>
      <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">
        {restaurant?.name || 'Chowly'}
      </h1>
      {restaurant?.address && (
        <p className="mt-2 text-sm text-muted">{restaurant.address}</p>
      )}

      <p className="mt-6 max-w-md text-base leading-relaxed text-ink/80">
        Browse tonight&rsquo;s menu, order right from your table, follow the wait, and settle
        up when you&rsquo;re ready — no app to download, no need to flag anyone down.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-muted">
        <span>Browse</span>
        <span className="text-clay-soft">&bull;</span>
        <span>Order from your table</span>
        <span className="text-clay-soft">&bull;</span>
        <span>Pay when ready</span>
      </div>

      <button type="button" onClick={onEnter} className="btn-primary mt-10 px-8 py-3 text-base">
        View the menu
      </button>

      <p className="mt-4 text-xs text-muted">
        {tableNumber
          ? `You're at Table ${tableNumber}.`
          : 'We’ll ask which table you’re at when you place your order.'}
      </p>

      <button
        type="button"
        onClick={onCheckOrder}
        className="mt-6 text-sm text-clay underline underline-offset-4 hover:text-clay-dark"
      >
        Already ordered? Check your order status
      </button>
    </div>
  );
}
