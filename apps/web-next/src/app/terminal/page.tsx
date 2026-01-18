'use client';

import { useEffect, useState } from 'react';
import { useTerminalState } from '@/lib/terminal/useTerminalState';
import TerminalTopBar from '@/components/terminal/TerminalTopBar';
import IconSidebar from '@/components/terminal/IconSidebar';
import MarketWatchPanel from '@/components/terminal/MarketWatchPanel';
import WorkspacePanel from '@/components/terminal/WorkspacePanel';
import RightPanel from '@/components/terminal/RightPanel';

const RIGHT_PANEL_KEY = 'ui.terminal.rightPanelOpen';

export default function TerminalPage() {
  const { setSelectedSymbol } = useTerminalState();
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(RIGHT_PANEL_KEY);
    if (stored !== null) {
      setRightOpen(stored === '1' || stored === 'true');
    }
    const symbol = new URLSearchParams(window.location.search).get('symbol');
    if (symbol) {
      setSelectedSymbol(symbol.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(RIGHT_PANEL_KEY, rightOpen ? '1' : '0');
  }, [rightOpen]);

  return (
    <div
      className="h-full min-h-0 overflow-hidden flex flex-col bg-neutral-950 relative"
      data-testid="terminal-root"
    >
      <TerminalTopBar />
      <div
        className="flex-1 min-h-0 grid grid-cols-[56px_240px_minmax(0,1fr)_320px] data-[right-open=false]:grid-cols-[56px_240px_minmax(0,1fr)]"
        data-right-open={rightOpen ? 'true' : 'false'}
      >
        <IconSidebar />
        <MarketWatchPanel />
        <WorkspacePanel />
        {rightOpen ? <RightPanel /> : null}
      </div>
      <button
        className="absolute top-[10px] right-3 text-[10px] text-neutral-500"
        onClick={() => setRightOpen((v) => !v)}
        aria-label="Toggle right panel"
      >
        Panel
      </button>
    </div>
  );
}
