export function getPyApiBase(): string {
  // Check if we're running in development mode (localhost)
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Always use the environment variable URL if set
  const envUrl = (import.meta as any).env?.VITE_PY_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }
  
  // For local development, use local backend
  if (isLocalDev) {
    return 'http://127.0.0.1:8000';
  }
  
  // Fallback to production URL for production deployments
  return 'https://homeandown-backend.onrender.com';
}

// Helper function to get the full API URL for a given path
export function getApiUrl(path: string): string {
  const base = getPyApiBase();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function pyFetch(path: string, options: RequestInit & { useApiKey?: boolean } = {}) {
  const base = getPyApiBase();
  
  // Build the full URL - all paths should use the configured API base
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  
  
  const headers: Record<string, string> = {
    ...(options.headers as any),
  };
  
  // Only set Content-Type for JSON requests
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  const apiKey = (import.meta as any).env?.VITE_PYTHON_API_KEY;
  // Only include the API key when explicitly requested. Default to false so
  // browser session (cookie) based auth works by default.
  const wantKey = options.useApiKey ?? false;

  if (wantKey && apiKey && apiKey.trim()) {
    headers['X-API-Key'] = apiKey;
  }
  
  try {
    // Ensure cookies (refresh token cookie) are sent/accepted when calling
    // the Python API so session-based endpoints like /auth/me work.
    const resp = await fetch(url, { ...options, headers, credentials: 'include' });
    
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `API request failed with status ${resp.status}`);
    }
    
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await resp.json();
      return data;
    }
    
  const text = await resp.text();
  return text;
  } catch (error) {
    // Network-level failures (cannot reach backend)
    const anyErr: any = error;
    if (anyErr && (anyErr.name === 'TypeError' || anyErr.message === 'Failed to fetch')) {
      throw new Error(`NetworkError: Could not reach ${base} - is the backend running?`);
    }

    // If the thrown error contains a JSON payload string (from the server), try to parse
    const raw = anyErr && anyErr.message ? anyErr.message : String(anyErr);
    try {
      const parsed = JSON.parse(raw);
      // Prefer common shapes: { detail: '...' } or { message: '...' } or { detail: { message: '...' } }
      const candidate = parsed?.detail?.message || parsed?.detail || parsed?.message || (typeof parsed === 'string' ? parsed : undefined);
      throw new Error(candidate || 'API request failed');
    } catch (_parseErr) {
      // Not JSON or failed parsing — rethrow a friendly message
      throw new Error(raw || 'API request failed');
    }
  }
}