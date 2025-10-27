export const isDefined = <T>(v: T | null | undefined): v is T => v !== null && v !== undefined;
export const hasKeys = <T extends object>(o: unknown, keys: (keyof T)[]): o is T =>
  !!o && typeof o === "object" && keys.every(k => k in (o as any)); 