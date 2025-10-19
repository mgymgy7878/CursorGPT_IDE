function rid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

type Meta = { intent?: string; source?: "dashboard" | "strategy-lab" };

export async function getJSON<T = any>(url: string, meta?: Meta) {
  const r = await fetch(url, {
    headers: {
      "X-Spark-Actor": "ui",
      "X-Spark-Source": meta?.source ?? "dashboard",
      "X-Spark-Intent": meta?.intent ?? "get",
      "X-Request-Id": rid(),
    },
    cache: "no-store" as any,
  });
  if (!r.ok) {
    let text = "";
    try { text = await r.text(); } catch {}
    throw new Error(`HTTP ${r.status} @ ${url} ${text?.slice(0,120)}`);
  }
  return r.json() as Promise<T>;
}

export async function postJSON<T = any>(url: string, body: any, meta?: Meta) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Spark-Actor": "ui",
      "X-Spark-Source": meta?.source ?? "dashboard",
      "X-Spark-Intent": meta?.intent ?? "post",
      "X-Request-Id": rid(),
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let text = "";
    try { text = await r.text(); } catch {}
    throw new Error(`HTTP ${r.status} @ ${url} ${text?.slice(0,120)}`);
  }
  return r.json() as Promise<T>;
}

