export const appPaths = {
  dashboard: "/dashboard",
  strategyLab: "/strategy-lab",
  audit: "/audit",
  portfolio: "/portfolio",
  settings: "/settings",
} as const;

export type Role = "guest" | "user" | "admin";

export const redirects: Array<{ from: string; to: string }> = [
  { from: "/home", to: "/dashboard" },
  { from: "/backtest-lab", to: "/backtest" },
  // Route hijyeni: /running → /strategies/running (canonical)
  { from: "/running", to: "/strategies/running" },
];

export const routes: ReadonlyArray<{
  path: string;
  label: string;
  icon: string;
  protected?: boolean;
  roles?: Role[];
}> = [
  { path: "/dashboard", label: "Anasayfa", icon: "Home", protected: false },
  { path: "/portfolio", label: "Portföy", icon: "PieChart", protected: true, roles: ["user", "admin"] },
  { path: "/analysis", label: "Analiz", icon: "LineChart", protected: true, roles: ["user", "admin"] },
  { path: "/strategies", label: "Stratejiler", icon: "List", protected: true, roles: ["user", "admin"] },
  { path: "/running", label: "Çalışan Stratejiler", icon: "Activity", protected: true, roles: ["user", "admin"] },
  { path: "/strategy-lab", label: "Strateji Lab", icon: "FlaskConical", protected: true, roles: ["user", "admin"] },
  { path: "/backtest", label: "Backtest", icon: "BarChart", protected: true, roles: ["user", "admin"] },
  { path: "/technical-analysis", label: "Teknik Analiz", icon: "LineChart", protected: true, roles: ["user", "admin"] },
  { path: "/alerts", label: "Uyarılar", icon: "Bell", protected: true, roles: ["user", "admin"] },
  { path: "/observability", label: "Gözlemlenebilirlik", icon: "ActivitySquare", protected: true, roles: ["user", "admin"] },
  { path: "/reports/verify", label: "Rapor Doğrulama", icon: "FileCheck2", protected: true, roles: ["admin"] },
  { path: "/settings", label: "Ayarlar", icon: "Settings", protected: false },
] as const;

export const protectedRoutes = routes
  .filter(r => r.protected)
  .map(r => r.path);


