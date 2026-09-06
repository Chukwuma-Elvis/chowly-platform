export default function Logo({ dark }) {
  const mark = dark ? '#E8C7BB' : '#C0563B';
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="none" stroke={mark} strokeWidth="1.5" />
        <path
          d="M16 7c2.5 3 4 5.4 4 8.2A4 4 0 0 1 16 19a4 4 0 0 1-4-3.8C12 12.4 13.5 10 16 7Z"
          fill={mark}
        />
        <path d="M16 19v6" stroke={mark} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="leading-none">
        <div
          className={`font-serif text-base font-semibold tracking-[0.2em] sm:text-lg ${
            dark ? 'text-cream' : 'text-ink'
          }`}
        >
          CHOWLY
        </div>
        <div
          className={`hidden text-[10px] uppercase tracking-[0.3em] sm:block ${
            dark ? 'text-cream/60' : 'text-muted'
          }`}
        >
          Fine Dining
        </div>
      </div>
    </div>
  );
}
