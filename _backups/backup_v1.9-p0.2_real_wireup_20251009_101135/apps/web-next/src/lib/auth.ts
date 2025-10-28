// Client-side auth helpers

let cachedToken: string | null = null;

export function setAuthToken(token: string) {
  cachedToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin-token', token);
    document.cookie = `admin-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
  }
}

export function getAuthToken(): string | null {
  if (cachedToken) return cachedToken;
  
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('admin-token');
    if (stored) {
      cachedToken = stored;
      return stored;
    }
  }
  
  return null;
}

export function clearAuthToken() {
  cachedToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin-token');
    document.cookie = 'admin-token=; path=/; max-age=0';
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { 'x-admin-token': token } : {};
}

