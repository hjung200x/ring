export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  const hasBody = init?.body !== undefined && init?.body !== null;

  if (hasBody) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  } else {
    headers.delete('Content-Type');
  }

  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined;
  }
  return response.json();
}
