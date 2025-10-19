"use client";
import { ReactNode } from "react";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";

/**
 * Lazy chart wrapper - only renders chart when visible
 * Prevents expensive Recharts renders for off-screen content
 */
export function LazyChart({ 
  children, 
  fallback = <ChartSkeleton /> 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref} className="min-h-[200px]">
      {isVisible ? children : fallback}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-24 bg-neutral-800 rounded"></div>
      <div className="h-48 bg-neutral-800 rounded"></div>
    </div>
  );
}

