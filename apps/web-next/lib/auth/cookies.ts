import { cookies } from "next/headers";
import { verifyToken } from "@spark/auth";

const NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
function isSecure() {
  return process.env.COOKIE_SECURE === "1" || process.env.NODE_ENV === "production";
}

export function setAuthCookie(token: string) {
  let maxAge: number | undefined;
  try {
    const claims = verifyToken(token) as any;
    if (claims?.exp) {
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = claims.exp - nowSec;
      if (rem > 0) maxAge = rem;
    }
  } catch {
    // verify sadece Max-Age hesaplamak için; geçersizse set etmeye gerek yok
  }

  cookies().set({
    name: NAME,
    value: token,
    httpOnly: true,
    secure: isSecure(),
    sameSite: "strict",
    path: "/",
    ...(maxAge ? { maxAge } : {})
  });
}

export function clearAuthCookie() {
  cookies().set({
    name: NAME,
    value: "",
    httpOnly: true,
    secure: isSecure(),
    sameSite: "strict",
    path: "/",
    expires: new Date(0)
  });
} 
