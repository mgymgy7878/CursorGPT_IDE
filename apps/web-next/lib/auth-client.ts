"use client";

export type SparkSession = { 
  email?: string; 
  role?: "admin"|"trader"|"viewer"; 
  demo?: boolean 
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escapedName = name.replace(/([.$?*|{}()\\[\]\\/\\+^])/g, "\\$1");
  const m = document.cookie.match(new RegExp("(?:^|; )" + escapedName + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export function getSessionClient(): SparkSession {
  try { 
    const raw = readCookie("spark.session"); 
    return raw ? JSON.parse(raw) : {}; 
  } catch { 
    return {}; 
  }
}

export function canExecuteClient() {
  const s = getSessionClient();
  const demoDisabled = (process.env.NEXT_PUBLIC_DEMO_ENABLE_ACTIONS ?? "false") !== "true" && s?.demo;
  return !demoDisabled && (s?.role === "admin" || s?.role === "trader");
}

export function hasRoleClient(requiredRole: string) {
  const session = getSessionClient();
  return session?.role === requiredRole;
}

export function isDemoClient() {
  const session = getSessionClient();
  return session?.demo === true;
} 