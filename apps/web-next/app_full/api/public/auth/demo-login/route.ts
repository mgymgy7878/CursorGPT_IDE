import { NextResponse } from "next/server";
export async function POST() {
  // Demo cookie (httpOnly değil → yalnız demo)
  const res = NextResponse.json({ ok:true, demo:true });
  res.cookies.set('spark.session', 'demo', { path:'/' });
  return res;
} 