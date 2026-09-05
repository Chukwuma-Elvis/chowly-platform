// Read-only star row, or an interactive picker when onPick is supplied.
export default function Stars({ value = 0, onPick }) {
  return (
    <span className="inline-flex gap-0.5 text-lg leading-none">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <span className={filled ? 'text-amber-500' : 'text-sand'}>★</span>
        );
        return onPick ? (
          <button key={n} type="button" onClick={() => onPick(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </span>
  );
}
