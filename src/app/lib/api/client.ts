const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiClient<T = unknown>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}/${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
