const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const appBasePath = (() => {
  const baseUrl = (import.meta.env.BASE_URL || '/').trim();
  if (!baseUrl || baseUrl === '/') return '';
  return trimTrailingSlash(baseUrl);
})();

export const apiPath = (path: string) => {
  if (import.meta.env.DEV) {
    return path;
  }

  if (path.startsWith('/api') || path.startsWith('/internal')) {
    return `${appBasePath}${path}`;
  }

  return path;
};

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

  const response = await fetch(apiPath(path), {
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
