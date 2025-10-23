import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Not: İleride redirect/guard ekleyeceksek burayı genişleteceğiz.
// Şimdilik sadece pass-through.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// Matcher'ı sade tut: statik varlıkları ve Next iç yollarını dışarıda bırak.
export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};


