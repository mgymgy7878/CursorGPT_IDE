import jwt from "jsonwebtoken";

export type Role = "public" | "user" | "admin";

export interface JwtClaims {
  sub: string;          // user id
  role: Role;
  iat?: number;
  exp?: number;
}

const REQUIRED = ["JWT_SECRET"] as const;
function env(name: typeof REQUIRED[number]) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function signToken(claims: JwtClaims, expiresIn: string = "12h") {
  return jwt.sign(claims, env("JWT_SECRET"), { expiresIn }) as string;
}

export function verifyToken(token: string): JwtClaims {
  return jwt.verify(token, env("JWT_SECRET")) as JwtClaims;
}

export function roleAtLeast(actual: Role, required: Role): boolean {
  const order: Record<Role, number> = { public: 0, user: 1, admin: 2 };
  return order[actual] >= order[required];
}

export function isDevAuth(): boolean {
  return process.env.DEV_AUTH === "1" || process.env.DEV_AUTH === "true";
}

// Small helper for Next/Edge middleware-compatible header parsing
export function extractBearer(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}
