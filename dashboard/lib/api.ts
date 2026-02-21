export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, body: { error: { code: string; message: string } }) {
    super(body.error.message);
    this.status = status;
    this.code = body.error.code;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = "/login";
    throw new ApiError(401, { error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data;
}

export const fetcher = <T>(path: string) => apiFetch<T>(path);
