/**
 * A slider over a few fixed steps ("Last 5 years", "Last 12 months"): the same look in every section.
 * Fixed width, so the track never moves under the pointer while a neighbouring control changes size.
 */
export default function StepSlider<T extends string | number>({ steps, value, onChange, label, prefix = 'Last' }: {
  steps: T[];
  value: T;
  onChange: (v: T) => void;
  /** Text for a step, e.g. "5 years". */
  label: (v: T) => string;
  prefix?: string;
}) {
  const i = Math.max(0, steps.indexOf(value));
  return (
    <label className="flex shrink-0 items-center gap-3 text-xs text-ink-400">
      <span className="w-8 shrink-0">{prefix}</span>
      <input
        type="range" min={0} max={steps.length - 1} step={1} value={i}
        onChange={(e) => onChange(steps[Number(e.target.value)])}
        aria-valuetext={label(value)}
        className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-ink-800 accent-brand-500 sm:w-44"
      />
      <span className="tabular w-20 shrink-0 text-sm text-ink-100">{label(value)}</span>
    </label>
  );
}
