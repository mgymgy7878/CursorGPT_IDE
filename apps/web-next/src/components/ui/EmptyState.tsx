"use client";

import * as Icons from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

interface EmptyStateProps {
  title: string;
  description: string;
  /**
   * Icon - can be:
   * - Lucide icon name (e.g. "FileSearch", "Bell")
   * - Emoji string (e.g. "📋", "🔔")
   * - undefined (shows default document icon)
   */
  icon?: string;
  /**
   * @deprecated Use `action` object instead
   */
  actionLabel?: string;
  /**
   * @deprecated Use `action` object instead
   */
  onAction?: () => void;
  /**
   * Optional action button
   */
  action?: EmptyStateAction;
}

/**
 * EmptyState v2 - Reusable empty state component
 *
 * Features:
 * - Supports Lucide icons (consistent) or emoji fallback
 * - Standardized sizing (size-10 for icons)
 * - Better text hierarchy and contrast
 * - Flexible action button
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   title="No strategies yet"
 *   description="Create your first strategy to get started"
 *   icon="FileSearch"
 *   action={{ label: "Create Strategy", onClick: handleCreate }}
 * />
 * ```
 */
export default function EmptyState({
  title,
  description,
  icon = "FileText",
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  // Support old API (actionLabel + onAction) for backward compatibility
  const finalAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined);

  // Render icon (Lucide or emoji)
  const renderIcon = () => {
    // Check if it's an emoji (single char or simple emoji)
    if (icon && (icon.length <= 2 || /\p{Emoji}/u.test(icon))) {
      return <div className="text-5xl mb-4">{icon}</div>;
    }

    // Try to resolve as Lucide icon
    const IconComponent = icon ? (Icons as any)[icon] : Icons.FileText;
    if (IconComponent) {
      return <IconComponent className="size-10 mb-4 text-neutral-400" />;
    }

    // Fallback to default
    return <Icons.FileText className="size-10 mb-4 text-neutral-400" />;
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      role="status"
      aria-live="polite"
    >
      {renderIcon()}
      <h3 className="text-lg font-medium mb-2 text-neutral-300">{title}</h3>
      <p className="text-sm text-neutral-400 mb-6 max-w-md leading-relaxed">{description}</p>
      {finalAction && (
        <button
          onClick={finalAction.onClick}
          className={`px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 ${
            finalAction.variant === "ghost"
              ? "bg-transparent border border-zinc-700 hover:bg-zinc-800 text-neutral-300"
              : "bg-blue-600 hover:bg-blue-700 text-white focus-visible:outline-blue-500"
          }`}
        >
          {finalAction.label}
        </button>
      )}
    </div>
  );
}

