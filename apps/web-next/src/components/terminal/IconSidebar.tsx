const icons = ['🏠', '📈', '🧭', '🗂️', '⚙️'];

export default function IconSidebar() {
  return (
    <aside
      className="flex flex-col items-center gap-3 py-3 bg-neutral-950/70 border-r border-white/6"
      data-testid="terminal-sidebar"
    >
      {icons.map((icon, idx) => (
        <button
          key={idx}
          className="w-9 h-9 rounded-lg bg-neutral-900 text-lg flex items-center justify-center hover:bg-neutral-800 transition-colors"
          aria-label={`Sidebar item ${idx + 1}`}
        >
          <span aria-hidden="true">{icon}</span>
        </button>
      ))}
    </aside>
  );
}
