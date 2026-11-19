/** Pill switch for a few mutually exclusive options. */
export default function Segmented({ value, options, onChange, label }: {
  value: string; options: { id: string; label: string }[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-9 items-center rounded-full border border-ink-700/80 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-full rounded-full px-3 font-medium transition-colors ${value === o.id ? 'bg-ink-50 text-ink-950' : 'text-ink-400 hover:text-ink-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
