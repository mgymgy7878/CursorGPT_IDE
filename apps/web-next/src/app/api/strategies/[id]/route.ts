import { NextResponse } from 'next/server';

const B = process.env.EXECUTOR_BASE_URL;

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!B) return NextResponse.json({ ok: true }, { status: 200 });
  const r = await fetch(`${B}/api/strategies/${params.id}`, { method: 'DELETE' });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
