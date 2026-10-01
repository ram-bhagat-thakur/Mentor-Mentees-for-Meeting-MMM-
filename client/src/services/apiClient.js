const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api").replace(
  /\/+$/,
  "",
);
const TOKEN_KEY = "mmm.auth.token";

export const tokenStorage = {
  get() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = tokenStorage.get();

  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || "The request could not be completed.");
  }

  return result;
}