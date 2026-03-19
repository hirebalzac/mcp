const BASE_URL = process.env.BALZAC_API_URL || 'https://api.hirebalzac.ai/v1';

function getApiKey(): string {
  const key = process.env.BALZAC_API_KEY || '';
  if (!key) {
    throw new Error('BALZAC_API_KEY environment variable is required.');
  }
  return key;
}

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

class BalzacClient {
  private maxRetries = 3;

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>,
    attempt = 1
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${BASE_URL}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: 'application/json',
    };
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429 && attempt <= this.maxRetries) {
      const retryAfter = Number(res.headers.get('Retry-After') || 2);
      const delay = retryAfter * 1000 * attempt;
      await new Promise((r) => setTimeout(r, delay));
      return this.request<T>(method, path, body, query, attempt + 1);
    }

    if (res.status === 204) {
      return { status: 204, data: {} as T };
    }

    const data = (await res.json()) as T;

    if (!res.ok) {
      const err = data as Record<string, unknown>;
      const error = (err.error || err) as Record<string, unknown>;
      const msg = (error.message as string) || `HTTP ${res.status}`;
      throw new Error(`[${res.status}] ${msg}`);
    }

    return { status: res.status, data };
  }

  async get<T = unknown>(path: string, query?: Record<string, string | number | undefined>) {
    return this.request<T>('GET', path, undefined, query);
  }

  async post<T = unknown>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  async patch<T = unknown>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body);
  }

  async del<T = unknown>(path: string, query?: Record<string, string | number | undefined>) {
    return this.request<T>('DELETE', path, undefined, query);
  }
}

export const client = new BalzacClient();
