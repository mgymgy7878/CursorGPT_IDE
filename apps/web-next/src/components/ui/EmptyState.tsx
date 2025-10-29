"use client";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Reusable empty state component
 * Used across: Strategies, Running, Dashboard widgets
 */
export default function EmptyState({
  title,
  description,
  icon = "📋",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-12 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 text-neutral-200">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

