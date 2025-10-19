import { routes, type Role } from "./routes";

const norm = (p: string): string => {
  if (!p || p === "/") return "/";
  return p.endsWith("/") ? p.slice(0, -1) : p;
};

const FALLBACK_PROTECTED = new Set<string>([
  "/portfolio",
  "/strategies",
  "/running",
  "/strategy-lab",
  "/backtest",
  "/technical-analysis",
  "/alerts",
  "/observability",
  "/reports/verify",
]);

type RouteRow = { path: string; protected: boolean; roles?: Role[] };
const TABLE: ReadonlyArray<RouteRow> = routes.map((r) => ({
  path: norm(r.path),
  protected: Boolean(r.protected) || FALLBACK_PROTECTED.has(norm(r.path)),
  roles: r.roles,
}));

export const protectedRoutes: string[] = TABLE.filter(r => r.protected).map(r => r.path);

export function isProtectedPath(pathname: string): boolean {
  const p = norm(pathname);
  const hit = TABLE.find((r) => p === r.path || p.startsWith(r.path + "/"));
  return Boolean(hit && (hit.protected || (hit.roles && hit.roles.length)));
}

export function roleOfRoute(pathname: string): Role[] | undefined {
  const p = norm(pathname);
  const sorted = [...TABLE].sort((a, b) => b.path.length - a.path.length);
  const hit = sorted.find((r) => p === r.path || p.startsWith(r.path + "/"));
  return hit?.roles;
}


