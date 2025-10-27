"use client";
import { useState, useEffect } from "react";
import { 
  Grid, 
  Ruler, 
  Eye, 
  Navigation, 
  FileText, 
  RefreshCw, 
  Palette,
  Command,
  LayoutDashboard,
  Activity,
  FlaskConical,
  Wallet,
  LineChart,
  Settings
} from "lucide-react";

interface BuilderToolbarProps {
  isVisible?: boolean;
}

export default function BuilderToolbar({ isVisible = true }: BuilderToolbarProps) {
  const [showTooltips, setShowTooltips] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Implement command palette
        console.log('Command palette opened');
      }

      // Navigation shortcuts
      if (e.key === 'g') {
        e.preventDefault();
        const nextKey = e.key;
        switch (nextKey as any) {
          case 'd':
            window.location.href = '/dashboard';
            break;
          case 'c':
            window.location.href = '/control-center';
            break;
          case 'l':
            window.location.href = '/strategy-lab';
            break;
          case 'p':
            window.location.href = '/portfolio';
            break;
          case 'a':
            window.location.href = '/analytics';
            break;
          case 's':
            window.location.href = '/settings';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tools = [
    { id: 'grid', icon: Grid, label: 'Grid', shortcut: 'G' },
    { id: 'baseline', icon: Ruler, label: 'Baseline', shortcut: 'B' },
    { id: 'rulers', icon: Eye, label: 'Rulers', shortcut: 'R' },
    { id: 'nav', icon: Navigation, label: 'Open Nav', shortcut: 'N' },
    { id: 'evidence', icon: FileText, label: 'Evidence', shortcut: 'E' },
    { id: 'refresh', icon: RefreshCw, label: 'Hard Refresh', shortcut: 'F5' },
    { id: 'theme', icon: Palette, label: 'Theme', shortcut: 'T' },
  ];

  const quickNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Anasayfa', shortcut: 'g d' },
    { href: '/control-center', icon: Activity, label: 'Control Center', shortcut: 'g c' },
    { href: '/strategy-lab', icon: FlaskConical, label: 'Strategy Lab', shortcut: 'g l' },
    { href: '/portfolio', icon: Wallet, label: 'Portfolio', shortcut: 'g p' },
    { href: '/analytics', icon: LineChart, label: 'Analytics', shortcut: 'g a' },
    { href: '/settings', icon: Settings, label: 'Settings', shortcut: 'g s' },
  ];

  if (!isVisible || process.env.NEXT_PUBLIC_UI_BUILDER !== 'true') {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-50"
      data-builder="on"
      onMouseEnter={() => setShowTooltips(true)}
      onMouseLeave={() => setShowTooltips(false)}
    >
      {/* Main Toolbar */}
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-2 shadow-xl">
        <div className="flex flex-col space-y-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(isActive ? null : tool.id)}
                className={`p-2 rounded-md transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <Icon className="w-4 h-4" />
                
                {/* Tooltip */}
                {showTooltips && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded whitespace-nowrap opacity-90">
                    {tool.label}
                    <div className="text-zinc-400 text-xs">{tool.shortcut}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mt-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-2 shadow-xl">
        <div className="flex flex-col space-y-1">
          {quickNav.map((nav) => {
            const Icon = nav.icon;
            
            return (
              <button
                key={nav.href}
                onClick={() => window.location.href = nav.href}
                className="p-2 rounded-md transition-all duration-200 group relative text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                title={`${nav.label} (${nav.shortcut})`}
              >
                <Icon className="w-4 h-4" />
                
                {/* Tooltip */}
                {showTooltips && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded whitespace-nowrap opacity-90">
                    {nav.label}
                    <div className="text-zinc-400 text-xs">{nav.shortcut}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Command Palette Hint */}
      <div className="mt-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-2 shadow-xl">
        <button
          className="p-2 rounded-md transition-all duration-200 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          title="Command Palette (Ctrl/Cmd + K)"
        >
          <Command className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 