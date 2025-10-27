import * as Auth from "@spark/auth";
export * from "@spark/auth";
export { createToken, setCookie, clearCookie } from "./auth-server";

export const getBearerFromHeader = Auth.extractBearer;
export const isDevToken = Auth.isDevAuth;
export type JwtClaims = import("@spark/auth").JwtClaims;

export function readCookie(name: string, source?: string): string | undefined {
  const cookieStr = source ?? (typeof document !== "undefined" ? document.cookie : "");
  const rx = new RegExp("(?:^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&") + "=([^;]*)");
  const m = cookieStr.match(rx);
  return m ? decodeURIComponent(m[1]) : undefined;
}
export function getTokenFromCookie(source?: string): string | undefined {
  return readCookie("auth", source) ?? Auth.readAuthFromCookie(source);
}
export default Auth;
