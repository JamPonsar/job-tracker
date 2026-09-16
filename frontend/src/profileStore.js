const STORAGE_KEY = 'activeProfileId';

let activeProfileId = null;

export function getActiveProfileId() {
  return activeProfileId;
}

export function setActiveProfileId(id) {
  activeProfileId = id;
  if (id) localStorage.setItem(STORAGE_KEY, String(id));
}

export function loadStoredProfileId() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const parsed = Number(stored);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
