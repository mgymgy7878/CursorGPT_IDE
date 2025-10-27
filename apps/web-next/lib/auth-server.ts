import * as Auth from "@spark/auth";

export type CookieOptions = {
  maxAge?: number; path?: string; secure?: boolean; httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none"; domain?: string;
  [k: string]: unknown;
};

export const readCookie = Auth.readCookie;
export const verifyToken = Auth.verifyToken;

export function createToken(_payload?: Record<string, unknown>, _opts?: { expSeconds?: number; [k: string]: unknown }): string {
  return "stub.token";
}
export function setCookie(_name: string, _value: string, _opts?: CookieOptions): void { /* no-op */ }
export function clearCookie(_name: string, _opts?: Pick<CookieOptions, "path" | "domain">): void { /* no-op */ }

export default { 
  readCookie, 
  verifyToken, 
  createToken, 
  setCookie, 
  clearCookie 
};
