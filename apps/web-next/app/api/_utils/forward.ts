export async function forward(path: string, init?: RequestInit) {
  const origin = process.env.EXECUTOR_ORIGIN || 'http://127.0.0.1:4001';
  return fetch(origin + path, { cache: 'no-store', ...(init||{}) });
}
