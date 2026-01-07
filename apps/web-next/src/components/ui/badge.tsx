import * as React from "react";
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-500/20 border-blue-500/30 text-blue-300",
      secondary: "bg-neutral-500/20 border-neutral-500/30 text-neutral-300",
      destructive: "bg-red-500/20 border-red-500/30 text-red-300",
      outline: "border border-neutral-700 text-neutral-300 hover:bg-neutral-800",
      success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
      warning: "bg-amber-500/20 border-amber-500/30 text-amber-300",
      info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
