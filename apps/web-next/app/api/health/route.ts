import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Basit, her zaman 200 dönen health; dış bağımlılıklara takılmaz
  const now = new Date().toISOString();
  return NextResponse.json({ status: 'ok', env: 'web-next', time: now }, { status: 200 });
}