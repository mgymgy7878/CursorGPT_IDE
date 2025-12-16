"use client";
import React from "react";

interface CommandButtonProps {
  variant?: 'full' | 'compact';
}

export function CommandButton({ variant = 'full' }: CommandButtonProps) {
  // data-testid: visual test'te "komut butonu sayısı = 1" assert'i için
  // variant: 1440px viewport'ta "full" (⌘K Commands), dar ekranda "compact" (⌘K)
  const label = variant === 'full' ? '⌘K Commands' : '⌘K';
  
  return (
    <button
      data-testid="command-button"
      className="rounded-full px-2.5 py-1 bg-neutral-800/60 hover:bg-neutral-700/60 border border-neutral-700/50 text-neutral-300 text-xs font-medium transition-colors">
      {label}
    </button>
  );
}
