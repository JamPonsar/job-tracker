import { useEffect, useState } from 'react';
import { renameProfile } from '../api.js';
import ActivityHeatmap from './ActivityHeatmap.jsx';

const THEME_OPTIONS = [
  { value: 'light', label: 'Snow', swatch: '#2f6feb' },
  { value: 'dark', label: 'Night', swatch: '#0b1120' },
  { value: 'pastel-pink', label: 'Princess', swatch: '#e0679d' },
  { value: 'pastel-blue', label: 'Sky', swatch: '#4a90d9' },
  { value: 'pastel-purple', label: 'Lavender', swatch: '#9569d6' },
];

export default function ProfileTab({ profile, profiles, onSwitchProfile, onAddProfileClick, theme, onThemeChange, onRenamed }) {
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  useEffect(() => {
    setName(profile?.name || '');
    setSavedMessage(null);
    setError(null);
  }, [profile?.id]);

  async function handleSave() {
    setError(null);
    setSavedMessage(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Profile name cannot be empty.');
      return;
    }
    if (trimmed === profile.name) return;

    setSaving(true);
    try {
      const updated = await renameProfile(profile.id, trimmed);
      onRenamed(updated);
      setSavedMessage('Profile name updated.');
    } catch (err) {
      setError(err.message || 'Failed to rename profile.');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="tab-panel">
      <h2>Profile</h2>

      <section className="settings-section">
        <div className="profile-split-row">
          <label className="field profile-split-half">
            <span>Active profile</span>
            <select value={profile.id} onChange={(e) => onSwitchProfile(Number(e.target.value))}>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="profile-split-half profile-split-right">
            <button className="btn btn-secondary" onClick={onAddProfileClick}>
              + Add Profile
            </button>
          </div>
        </div>

        <h3>Profile name</h3>
        <div className="field-row">
          <label className="field grow">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </label>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
        {savedMessage && <p className="success-text">{savedMessage}</p>}
      </section>

      <section className="settings-section">
        <h3>Application activity</h3>
        <ActivityHeatmap profileId={profile.id} />
      </section>

      <section className="settings-section">
        <h3>Appearance</h3>
        <p className="modal-subtext">Choose how the app looks.</p>
        <div className="theme-option-group">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`theme-option ${theme === opt.value ? 'active' : ''}`}
              onClick={() => onThemeChange(opt.value)}
            >
              <span className="theme-option-swatch" style={{ background: opt.swatch }} />
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
