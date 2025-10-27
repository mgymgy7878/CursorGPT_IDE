const BASE = process.env.EXECUTOR_BASE_URL!;

function actorInit(init?: RequestInit, actor = 'web'): RequestInit {
  return {
    ...(init || {}),
    headers: {
      'Content-Type': 'application/json',
      'X-Actor': actor,
      ...(init?.headers || {}),
    }
  };
}

export async function grGet(path: string, actor = 'web') {
  const res = await fetch(`${BASE}${path}`, actorInit({ cache: 'no-store' }, actor));
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

export async function grPost(path: string, body: any, actor = 'web') {
  const res = await fetch(`${BASE}${path}`, actorInit({ method: 'POST', body: JSON.stringify(body) }, actor));
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.json();
}
