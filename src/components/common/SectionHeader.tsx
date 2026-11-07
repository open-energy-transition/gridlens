interface SectionHeaderProps {
  title: string;
  description?: string;
}

export default function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-ink-50">{title}</h1>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
    </div>
  );
}
