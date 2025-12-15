'use client';

import { useEffect, useRef } from 'react';

type KeyCombo = string; // Örnek: "ctrl+enter", "ctrl+shift+o", "escape"

/**
 * Minimal hotkeys hook for Strategy Lab and Running Strategies.
 * 
 * @param keys - Key combination string (örn: "ctrl+enter", "ctrl+shift+o", "escape")
 * @param handler - Handler function
 * @param deps - Dependency array (handler'ın bağımlı olduğu değerler)
 * 
 * @example
 * useHotkeys('ctrl+enter', () => runBacktest(), [runBacktest]);
 * useHotkeys('ctrl+shift+o', () => runOptimize(), [runOptimize]);
 * useHotkeys('escape', () => closeModal(), [closeModal]);
 */
export function useHotkeys(
  keys: KeyCombo,
  handler: (e: KeyboardEvent) => void,
  deps: React.DependencyList = []
) {
  const handlerRef = useRef(handler);

  // Handler'ı her render'da güncelle (deps değiştiğinde)
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesKeys(e, keys)) {
        e.preventDefault();
        handlerRef.current(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys]); // keys değiştiğinde yeniden bağla
}

/**
 * Key combination string'i parse edip keyboard event ile eşleştir.
 * 
 * @param e - KeyboardEvent
 * @param combo - Key combination string (örn: "ctrl+enter", "ctrl+shift+o")
 * @returns true if matches
 */
function matchesKeys(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+').map(s => s.trim());
  
  // Modifier keys kontrolü
  const needsCtrl = parts.includes('ctrl') || parts.includes('control');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');
  const needsMeta = parts.includes('meta') || parts.includes('cmd');

  if (needsCtrl && !(e.ctrlKey || e.metaKey)) return false;
  if (needsShift && !e.shiftKey) return false;
  if (needsAlt && !e.altKey) return false;
  if (needsMeta && !e.metaKey) return false;

  // Ana tuş kontrolü (modifier'lar hariç)
  const mainKey = parts.find(p => 
    !['ctrl', 'control', 'shift', 'alt', 'meta', 'cmd'].includes(p)
  );

  if (!mainKey) return false;

  // Özel tuş mapping'leri
  const keyMap: Record<string, string> = {
    'enter': 'Enter',
    'escape': 'Escape',
    'esc': 'Escape',
    'space': ' ',
    'tab': 'Tab',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'arrowup': 'ArrowUp',
    'arrowdown': 'ArrowDown',
    'arrowleft': 'ArrowLeft',
    'arrowright': 'ArrowRight',
  };

  const expectedKey = keyMap[mainKey] || mainKey.toUpperCase();
  return e.key === expectedKey || e.key.toLowerCase() === mainKey.toLowerCase();
}

