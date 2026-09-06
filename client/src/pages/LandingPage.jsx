export default function LandingPage({ restaurant, onEnter, onCheckOrder }) {
  return (
    <>
      {/* Full-bleed background — sits behind the (transparent) header and content */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-ink bg-cover bg-center"
        style={{ backgroundImage: "url('/landing-bg.jpg')" }}
      >
        <div className="h-full w-full bg-gradient-to-b from-ink/70 via-ink/55 to-ink/85" />
      </div>

      <div className="mx-auto flex min-h-[72vh] max-w-2xl flex-col items-center justify-center py-10 text-center text-cream [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
        <svg width="60" height="60" viewBox="0 0 32 32" aria-hidden="true" className="mb-6">
          <circle cx="16" cy="16" r="15" fill="none" stroke="#E8C7BB" strokeWidth="1.25" />
          <path
            d="M16 6c3 3.6 4.8 6.5 4.8 9.8A4.8 4.8 0 0 1 16 20.6a4.8 4.8 0 0 1-4.8-4.8C11.2 12.5 13 9.6 16 6Z"
            fill="#E8C7BB"
          />
          <path d="M16 20.6V27" stroke="#E8C7BB" strokeWidth="1.25" strokeLinecap="round" />
        </svg>

        <div className="text-[11px] uppercase tracking-[0.35em] text-cream/70">Welcome to</div>
        <h1 className="mt-2 font-serif text-4xl text-cream sm:text-5xl">
          {restaurant?.name || 'Chowly'}
        </h1>
        {restaurant?.address && (
          <p className="mt-2 text-sm text-cream/70">{restaurant.address}</p>
        )}

        <p className="mt-6 max-w-md text-base leading-relaxed text-cream/90">
          Browse tonight&rsquo;s menu, order right from your table, follow the wait, and settle
          up when you&rsquo;re ready — no app to download, no need to flag anyone down.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-cream/60">
          <span>Browse</span>
          <span className="text-clay-soft">&bull;</span>
          <span>Order from your table</span>
          <span className="text-clay-soft">&bull;</span>
          <span>Pay when ready</span>
        </div>

        <button type="button" onClick={onEnter} className="btn-primary mt-10 px-8 py-3 text-base shadow-lg">
          View the menu
        </button>

        <button
          type="button"
          onClick={onCheckOrder}
          className="mt-6 text-sm text-cream/80 underline underline-offset-4 hover:text-cream"
        >
          Already ordered? Check your order status
        </button>
      </div>
    </>
  );
}
