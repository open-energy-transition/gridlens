interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Opt out of the default inner padding, e.g. for content that manages
   * its own padding per-section (like the map toolbar + canvas). */
  noPadding?: boolean;
}

export default function Card({ title, children, className = '', noPadding = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-ink-800 bg-ink-900/60 shadow-sm shadow-black/20 ${
        noPadding ? '' : 'p-5'
      } ${className}`}
    >
      {title && (
        <h3
          className={`font-display text-sm font-semibold uppercase tracking-wide text-ink-200 ${
            noPadding ? 'px-5 pt-5 pb-4' : 'mb-4'
          }`}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
