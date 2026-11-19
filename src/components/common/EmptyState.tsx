interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = 'Nothing matches these filters',
  message = 'Remove a filter to widen the selection.',
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-ink-800 px-6 py-12 text-center">
      <p className="text-sm text-ink-300">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{message}</p>
    </div>
  );
}
