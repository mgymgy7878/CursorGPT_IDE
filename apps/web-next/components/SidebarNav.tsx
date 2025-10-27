"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Cog, 
  Home, 
  LineChart, 
  Settings, 
  Target, 
  TrendingUp,
  Zap
} from "lucide-react";

const navItems = [
  { href: "/", label: "Anasayfa", icon: Home },
  { href: "/control-center", label: "Control Center", icon: Target },
  { href: "/strategy-lab", label: "Strategy Lab", icon: Zap },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/bist", label: "BIST", icon: LineChart },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-lg font-bold text-white">Spark</span>
        </div>
        <p className="text-xs text-neutral-400 mt-1">Trading Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-900 text-blue-200 border border-blue-700"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <div className="text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>System Online</span>
          </div>
          <div className="mt-1 text-neutral-600">
            v1.4.0 • Production Ready
          </div>
        </div>
      </div>
    </div>
  );
} 