import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { 
  matcher: [
    "/api/optimizer/:path*", 
    "/api/gates/promote-request",
    "/admin/:path*"
  ] 
};

export default function middleware(req: NextRequest) {
  const need = process.env.ADMIN_TOKEN;
  
  // Dev mode: token yoksa serbest
  if (!need) {
    return NextResponse.next();
  }
  
  // Token kontrolü (3 yol: header, x-admin-token, cookie)
  const authHeader = req.headers.get("authorization");
  const xAdminToken = req.headers.get("x-admin-token");
  const cookieToken = req.cookies.get("admin-token")?.value;
  
  const got = authHeader || xAdminToken || cookieToken;
  const ok = got?.includes(need) || got === need;
  
  if (!ok) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized", path: req.nextUrl.pathname }), 
      { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  return NextResponse.next();
}

