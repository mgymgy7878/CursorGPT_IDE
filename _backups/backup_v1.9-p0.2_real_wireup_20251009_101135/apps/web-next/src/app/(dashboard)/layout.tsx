'use client';
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Cpu, FileText, GitBranch, Shield, TrendingUp, Settings, Bot } from 'lucide-react';
import { CopilotDock } from '@/components/copilot/CopilotDock';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [copilotOpen, setCopilotOpen] = useState(false);
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Activity },
    { href: '/ml', label: 'ML Pipeline', icon: TrendingUp },
    { href: '/export', label: 'Export', icon: FileText },
    { href: '/optimizer', label: 'Optimizer', icon: Cpu },
    { href: '/gates', label: 'Drift Gates', icon: Shield },
    { href: '/backtest', label: 'Backtest', icon: GitBranch },
    { href: '/copilot', label: 'Copilot', icon: Bot },
    { href: '/admin/params', label: 'Params', icon: Settings },
  ];
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Spark Platform
          </h1>
          <p className="text-xs text-gray-500 mt-1">Trading & ML v1.8</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="font-mono">v1.8.0-rc1</div>
          <div className="mt-1">Observe-Only Mode</div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>

      {/* Copilot Floating Dock */}
      {!pathname?.startsWith('/copilot') && (
        <>
          <button
            onClick={() => setCopilotOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center z-40"
            title="Copilot AI"
          >
            <Bot className="w-6 h-6" />
          </button>
          <CopilotDock isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
        </>
      )}
    </div>
  );
}

