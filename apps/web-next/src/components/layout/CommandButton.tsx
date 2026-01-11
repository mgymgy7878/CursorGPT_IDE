"use client";
import React from "react";

interface CommandButtonProps {
  variant?: 'full' | 'compact';
}

export function CommandButton({ variant }: CommandButtonProps) {
  // data-testid: visual test'te "komut butonu sayısı = 1" assert'i için
  // Responsive: CSS ile otomatik (sm+: "⌘K Commands", küçükte "⌘K")
  // Bu, "yanlış yerde yanlış variant" riskini sıfırlar
  // variant prop'u hala destekleniyor (backward compatibility)
  const useResponsive = variant === undefined;

  return (
    <button
      data-testid="command-button"
      className="rounded-full px-2.5 py-1 bg-neutral-800/60 hover:bg-neutral-700/60 border border-neutral-700/50 text-neutral-300 text-xs font-medium transition-colors inline-flex items-center">
      {/* Responsive: CSS ile otomatik (sm+: "⌘K Commands", küçükte "⌘K") */}
      {/* data-testid: UI refactor'larda "test sürprizi"ni azaltmak için (class bağımlılığı yok) */}
      {useResponsive ? (
        <>
          <span className="sm:hidden" data-testid="command-label-compact">⌘K</span>
          <span className="hidden sm:inline" data-testid="command-label-full">⌘K Commands</span>
        </>
      ) : (
        variant === 'full' ? '⌘K Commands' : '⌘K'
      )}
    </button>
  );
}
