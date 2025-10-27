import { NextResponse } from "next/server";
export async function POST(){ return NextResponse.json({ ok:true, action:"admin/reload", ts: Date.now() }); }
