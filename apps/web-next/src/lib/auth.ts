import type { Role } from "@/config/routes";

function parseJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 2 ? "==" : b64.length % 4 === 3 ? "=" : "";
    const b64p = b64 + pad;
    // Prefer atob/TextDecoder for edge/browser, fallback to Buffer in Node
    let jsonStr: string;
    if (typeof atob === 'function') {
      const binStr = atob(b64p);
      const bytes = Uint8Array.from(binStr, c => c.charCodeAt(0));
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const buf = require('buffer').Buffer.from(b64p, 'base64');
      jsonStr = buf.toString('utf-8');
    }
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function inferRolesFromCookie(cookieValue?: string): Role[] {
  if (!cookieValue) return ["guest"] as Role[];
  const payload = parseJwt(cookieValue);
  if (!payload) return ["guest"] as Role[];

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < nowSec) {
    return ["guest"] as Role[];
  }
  const claimRoles = Array.isArray(payload.roles) ? payload.roles as string[] : [];
  const mapped: Role[] = claimRoles.includes("admin")
    ? ["admin"]
    : claimRoles.includes("user")
    ? ["user"]
    : ["guest"];
  return mapped;
}

export function hasAccess(path: string, roles: Role[], roleOfRoute: Record<string, Role[]>): boolean {
  const need = roleOfRoute[path];
  if (!need) return true;
  return roles.some((r) => need.includes(r));
}


