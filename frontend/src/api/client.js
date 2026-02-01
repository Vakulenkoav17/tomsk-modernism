export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ADMIN_AUTH_KEY = 'adminBasicAuth';

async function readError(response) {
  try {
    const data = await response.json();
    if (data && data.error) return data.error;
  } catch {
    // ignore parse errors
  }
  return `Request failed: ${response.status}`;
}

async function request(path, options = {}) {
  const { auth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  if (auth) {
    const token = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Basic ${token}`);
    }
  }
  const response = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGet(path, options = {}) {
  const response = await request(path, options);
  return parseResponse(response);
}

export async function apiForm(path, method, formData, options = {}) {
  const response = await request(path, { method, body: formData, ...options, auth: true });
  return parseResponse(response);
}

export async function apiDelete(path, options = {}) {
  const response = await request(path, { method: 'DELETE', ...options, auth: true });
  return parseResponse(response);
}

export function setAdminAuth(user, pass) {
  if (!user || !pass) {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    return;
  }
  const token = btoa(`${user}:${pass}`);
  sessionStorage.setItem(ADMIN_AUTH_KEY, token);
}

export function clearAdminAuth() {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
}

export function hasAdminAuth() {
  return Boolean(sessionStorage.getItem(ADMIN_AUTH_KEY));
}
