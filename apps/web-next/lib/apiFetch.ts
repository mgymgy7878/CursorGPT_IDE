export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { 
    ...init, 
    next: { 
      revalidate: 0, 
      ...(init?.next ?? {}) 
    } 
  });
}
