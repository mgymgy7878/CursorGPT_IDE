"use client";
import { ReactNode, useEffect, useState } from "react";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";

/**
 * Lazy widget wrapper - only loads data when visible
 * Prevents unnecessary API calls for off-screen widgets
 */
export function LazyWidget({ 
  children, 
  fallback = <WidgetSkeleton />,
  freezeOnceVisible = true
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  freezeOnceVisible?: boolean;
}) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible,
  });
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }
  }, [isVisible]);

  return (
    <div ref={ref} className="min-h-[100px]">
      {shouldRender ? children : fallback}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 bg-neutral-800 rounded"></div>
      <div className="h-20 bg-neutral-800 rounded"></div>
    </div>
  );
}

