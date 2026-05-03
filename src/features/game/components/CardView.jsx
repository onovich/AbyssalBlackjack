const COLOR_CLASS_MAP = {
  neutral: 'card--neutral',
  crimson: 'card--crimson',
};

export function CardView({ card, compact = false, onClick, removable = false, faded = false }) {
  if (!card) {
    return <div className="card card--empty">空</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'card',
        COLOR_CLASS_MAP[card.color],
        compact ? 'card--compact' : '',
        removable ? 'card--removable' : '',
        faded ? 'card--faded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="card__rank">{card.rank}</span>
      <span className="card__suit">{card.suit}</span>
      <span className="card__rank card__rank--bottom">{card.rank}</span>
    </button>
  );
}