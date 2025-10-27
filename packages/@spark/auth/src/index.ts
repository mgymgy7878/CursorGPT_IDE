export type Role = "admin" | "trader" | "viewer";

export type Session = { userId: string; roles: Role[]; token?: string; exp?: number; [k: string]: unknown };

export interface JwtClaims extends Record<string, unknown> {
  sub?: string; exp?: number; iat?: number; nbf?: number; roles?: string[];
  role?: string; email?: string; [k: string]: unknown;
}

export class AuthError extends Error {}

export function signToken(_payload: unknown): string { return "stub.token"; }

// Discriminated union for proper type narrowing
export type VerifyResult = 
  | { ok: true; payload: JwtClaims; reason?: never }
  | { ok: false; payload?: never; reason?: string };

export function verifyToken(_token: string): VerifyResult {
  return { ok: true, payload: { sub: "dev-user", role: "admin", exp: Math.floor(Date.now()/1000) + 3600 } };
}

export function isJwtClaims(x: unknown): x is JwtClaims {
  return typeof x === "object" && x !== null;
}

export async function getSession(_ctx?: unknown): Promise<Session | null> {
  return { userId: "dev", roles: ["admin"] };
}
export function requireRole(_required: Role | Role[]): boolean { return true; }
export function rbacCheck(_roles: Role[] | undefined, _required: Role): boolean { return true; }
export async function hash(_value: string): Promise<string> { return "hash"; }
export async function compare(_value: string, _hash: string): Promise<boolean> { return true; }
export function readCookie(_name: string): string | undefined { return undefined; }

export function extractBearer(h?: string | null): string | undefined {
  if (!h) return undefined;
  const m = h.match(/^\s*Bearer\s+(.+)\s*$/i);
  return m?.[1];
}
export function isDevAuth(token?: string): boolean {
  const dev = process.env.NEXT_PUBLIC_API_TOKEN ?? process.env.DEV_AUTH_TOKEN ?? "dev-token-123";
  return Boolean(token && token === dev);
}
export function claimsFromToken(_token?: string): JwtClaims | undefined { 
  return { sub: "dev", role: "admin" }; 
}
export function isExpired(c?: Pick<JwtClaims, "exp"> | null): boolean {
  if (!c?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return c.exp <= now;
}
export function readAuthFromCookie(cookieStr?: string): string | undefined {
  if (!cookieStr) return undefined;
  const m = cookieStr.match(/(?:^|;\s*)auth=([^;]+)/i);
  return m ? decodeURIComponent(m[1]) : undefined;
}

const defaultExport = {
  signToken, verifyToken, getSession, requireRole, rbacCheck, hash, compare,
  extractBearer, isDevAuth, claimsFromToken, isExpired, readAuthFromCookie, isJwtClaims
};
export default defaultExport;
