const TOKEN_KEY = 'sat.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Fetcher for SWR. Throws ApiError with the backend's error shape. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    ...init,
    headers: { ...headers, ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  if (res.status === 401 && !path.startsWith('/v1/auth')) {
    clearToken();
    window.location.href = '/login';
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
  }
  if (!res.ok) {
    let body: { error?: string; message?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, body.error ?? 'ERROR', body.message ?? res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export const post = <T>(path: string, json?: unknown) => api<T>(path, { method: 'POST', json });
