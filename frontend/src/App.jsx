import { useCallback, useEffect, useState } from 'react';
import { fetchApplications, fetchProfiles, createProfile, updateProfileTheme } from './api.js';
import { setActiveProfileId, loadStoredProfileId } from './profileStore.js';
import AddApplicationTab from './components/AddApplicationTab.jsx';
import ApplicationsTab from './components/ApplicationsTab.jsx';
import HistoryTab from './components/HistoryTab.jsx';
import ProfileTab from './components/ProfileTab.jsx';
import Modal from './components/Modal.jsx';

const TABS = ['Applications', 'Add Application', 'History', 'Profile'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Applications');
  const [applications, setApplications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileError, setProfileError] = useState(null);

  const currentProfile = profiles.find((p) => p.id === profileId);

  useEffect(() => {
    document.documentElement.dataset.theme = currentProfile?.theme || 'light';
  }, [currentProfile?.theme]);

  useEffect(() => {
    fetchProfiles().then((list) => {
      setProfiles(list);
      const stored = loadStoredProfileId();
      const initial = list.find((p) => p.id === stored) || list[0];
      if (initial) {
        setActiveProfileId(initial.id);
        setProfileId(initial.id);
      }
      setProfileReady(true);
    });
  }, []);

  const refreshApplications = useCallback(() => {
    if (!profileReady || !profileId) return;
    fetchApplications().then(setApplications).catch(() => {});
  }, [profileReady, profileId]);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  function handleSwitchProfile(id) {
    setActiveProfileId(id);
    setProfileId(id);
  }

  async function handleCreateProfile() {
    setProfileError(null);
    const name = newProfileName.trim();
    if (!name) {
      setProfileError('Enter a profile name.');
      return;
    }
    try {
      const created = await createProfile(name);
      setProfiles((list) => [...list, created]);
      setActiveProfileId(created.id);
      setProfileId(created.id);
      setNewProfileName('');
      setShowNewProfile(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to create profile.');
    }
  }

  function handleProfileRenamed(updated) {
    setProfiles((list) => list.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleThemeChange(newTheme) {
    if (!currentProfile || newTheme === currentProfile.theme) return;
    setProfiles((list) => list.map((p) => (p.id === currentProfile.id ? { ...p, theme: newTheme } : p)));
    try {
      await updateProfileTheme(currentProfile.id, newTheme);
    } catch {
      setProfiles((list) => list.map((p) => (p.id === currentProfile.id ? { ...p, theme: currentProfile.theme } : p)));
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1>Job Applicator</h1>
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <nav className={`tabs ${mobileMenuOpen ? 'tabs-open' : ''}`}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {!profileReady ? null : (
          <>
            {activeTab === 'Add Application' && (
              <AddApplicationTab onAdded={() => { refreshApplications(); setActiveTab('Applications'); }} />
            )}
            {activeTab === 'Applications' && (
              <ApplicationsTab applications={applications} onRefresh={refreshApplications} />
            )}
            {activeTab === 'History' && <HistoryTab active={activeTab === 'History'} profileId={profileId} />}
            {activeTab === 'Profile' && (
              <ProfileTab
                profile={currentProfile}
                profiles={profiles}
                onSwitchProfile={handleSwitchProfile}
                onAddProfileClick={() => setShowNewProfile(true)}
                theme={currentProfile?.theme || 'light'}
                onThemeChange={handleThemeChange}
                onRenamed={handleProfileRenamed}
              />
            )}
          </>
        )}
      </main>

      {showNewProfile && (
        <Modal onClose={() => setShowNewProfile(false)}>
          <h3>New profile</h3>
          <p className="modal-subtext">
            Profiles keep separate applications and history — use this for a different job search, a family
            member, or anything else you want to track independently.
          </p>
          <label className="field">
            <span>Profile name</span>
            <input
              type="text"
              autoFocus
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
            />
          </label>
          {profileError && <p className="error-text">{profileError}</p>}
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowNewProfile(false);
                setNewProfileName('');
                setProfileError(null);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateProfile}>
              Create
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
