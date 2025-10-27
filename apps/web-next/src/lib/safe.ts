export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

export function pickString(o: unknown, key: string): string | undefined {
  if (!isRecord(o)) return undefined;
  const v = o[key];
  if (typeof v === "string") return v;
  if (isRecord(v) && typeof (v as any).href === "string") return (v as any).href as string;
  return undefined;
}


