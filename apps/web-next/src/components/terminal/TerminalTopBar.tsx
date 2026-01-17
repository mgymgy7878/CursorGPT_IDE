export default function TerminalTopBar() {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-neutral-300 bg-neutral-950/60 border-b border-white/6"
      data-testid="terminal-topbar"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide">Spark Trading</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">Terminal</span>
      </div>
      <div className="flex items-center gap-4 whitespace-nowrap">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          API
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          WS
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Executor
        </span>
        <span>P95: 12ms</span>
        <span>RT Delay: 3ms</span>
        <span>Total Equity: $45.2K</span>
      </div>
    </div>
  );
}
