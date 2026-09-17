import { getActiveProfileId } from './profileStore.js';

const BASE = '/api';

let unauthorizedHandler = null;
// Called whenever a request other than login comes back 401 (session
// missing/expired) so the app can drop back to the login screen.
export function onUnauthorized(fn) {
  unauthorizedHandler = fn;
}

async function handle(res, notifyOnAuthFailure) {
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response (e.g. a proxy error page) — keep raw text for the error message below.
  }

  if (!res.ok) {
    if (res.status === 401 && notifyOnAuthFailure) unauthorizedHandler?.();
    const detail = data.error || text.slice(0, 300) || res.statusText;
    const message = `Request failed (${res.status}): ${detail}`;
    console.error('[api]', message, { status: res.status, body: text });
    throw new Error(message);
  }
  return data;
}

async function request(url, { skipAuthNotify, ...options } = {}) {
  const profileId = getActiveProfileId();
  const headers = { ...(options.headers || {}) };
  if (profileId) headers['X-Profile-Id'] = String(profileId);

  try {
    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    return await handle(res, !skipAuthNotify);
  } catch (err) {
    if (err instanceof TypeError) {
      const message = `Could not reach the backend at ${url}. Is the backend server running on port 3001?`;
      console.error('[api]', message, err);
      throw new Error(message);
    }
    throw err;
  }
}

export function login(username, password) {
  return request(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    skipAuthNotify: true,
  });
}

export function logout() {
  return request(`${BASE}/logout`, { method: 'POST' });
}

export function checkSession() {
  return request(`${BASE}/session`);
}

export function fetchApplications() {
  return request(`${BASE}/applications`);
}

export function createApplication(payload) {
  return request(`${BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateApplication(id, payload) {
  return request(`${BASE}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteApplication(id) {
  return request(`${BASE}/applications/${id}`, { method: 'DELETE' });
}

export function restoreApplication(id) {
  return request(`${BASE}/applications/${id}/restore`, { method: 'POST' });
}

export function fetchActivity() {
  return request(`${BASE}/applications/activity`);
}

export function fetchHistory() {
  return request(`${BASE}/history`);
}

export function fetchProfiles() {
  return request(`${BASE}/profiles`);
}

export function createProfile(name) {
  return request(`${BASE}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export function renameProfile(id, name) {
  return request(`${BASE}/profiles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export function updateProfileTheme(id, theme) {
  return request(`${BASE}/profiles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme }),
  });
}
