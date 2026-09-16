import { getActiveProfileId } from './profileStore.js';

const BASE = '/api';

async function handle(res) {
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response (e.g. a proxy error page) — keep raw text for the error message below.
  }

  if (!res.ok) {
    const detail = data.error || text.slice(0, 300) || res.statusText;
    const message = `Request failed (${res.status}): ${detail}`;
    console.error('[api]', message, { status: res.status, body: text });
    throw new Error(message);
  }
  return data;
}

async function request(url, options = {}) {
  const profileId = getActiveProfileId();
  const headers = { ...(options.headers || {}) };
  if (profileId) headers['X-Profile-Id'] = String(profileId);

  try {
    const res = await fetch(url, { ...options, headers });
    return await handle(res);
  } catch (err) {
    if (err instanceof TypeError) {
      const message = `Could not reach the backend at ${url}. Is the backend server running on port 3001?`;
      console.error('[api]', message, err);
      throw new Error(message);
    }
    throw err;
  }
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
