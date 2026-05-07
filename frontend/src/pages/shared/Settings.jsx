import { useContext, useState } from 'react';
import { Bell, KeyRound, Monitor, Save, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/auth-context';
import Avatar from '../../components/Avatar';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    avatarColor: user?.avatarColor || '#7091E6',
    bio: user?.bio || '',
    githubLink: user?.githubLink || '',
    linkedinLink: user?.linkedinLink || '',
  });
  const [notifications, setNotifications] = useState({
    assigned: true,
    reviewed: true,
    deadlines: true,
    weeklyDigest: false,
  });
  const [appearance, setAppearance] = useState({
    compact: false,
    darkMode: false,
  });

  const saveSettings = (event) => {
    event.preventDefault();
    toast.success('Settings saved locally');
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="settings-layout">
        <nav className="settings-tabs" aria-label="Settings sections">
          <button type="button" className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><UserRound size={18} /> Profile</button>
          <button type="button" className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}><KeyRound size={18} /> Security</button>
          <button type="button" className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}><Bell size={18} /> Notifications</button>
          <button type="button" className={activeTab === 'appearance' ? 'active' : ''} onClick={() => setActiveTab('appearance')}><Monitor size={18} /> Appearance</button>
        </nav>

        <form className="settings-panel" onSubmit={saveSettings}>
          {activeTab === 'profile' && (
            <>
              <div className="settings-profile-head">
                <Avatar name={profile.name} color={profile.avatarColor} size="lg" />
                <div>
                  <h2>Profile</h2>
                  <p>Update how you appear across annotation workflows.</p>
                </div>
              </div>
              <label className="input-group">
                <span className="input-label">Name</span>
                <input className="input-field" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
              </label>
              <label className="input-group">
                <span className="input-label">Avatar Color</span>
                <input type="color" className="input-field color-input" value={profile.avatarColor} onChange={(event) => setProfile({ ...profile, avatarColor: event.target.value })} />
              </label>
              <label className="input-group">
                <span className="input-label">Bio</span>
                <textarea className="input-field" rows="4" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
              </label>
              <label className="input-group">
                <span className="input-label">GitHub</span>
                <input className="input-field" value={profile.githubLink} onChange={(event) => setProfile({ ...profile, githubLink: event.target.value })} />
              </label>
              <label className="input-group">
                <span className="input-label">LinkedIn</span>
                <input className="input-field" value={profile.linkedinLink} onChange={(event) => setProfile({ ...profile, linkedinLink: event.target.value })} />
              </label>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h2>Security</h2>
              <label className="input-group">
                <span className="input-label">Current Password</span>
                <input type="password" className="input-field" />
              </label>
              <label className="input-group">
                <span className="input-label">New Password</span>
                <input type="password" className="input-field" />
              </label>
              <div className="active-session">
                <strong>Current session</strong>
                <span>Browser session secured with httpOnly cookie</span>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h2>Notifications</h2>
              {Object.entries(notifications).map(([key, enabled]) => (
                <label key={key} className="toggle-row">
                  <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" checked={enabled} onChange={(event) => setNotifications({ ...notifications, [key]: event.target.checked })} />
                </label>
              ))}
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h2>Appearance</h2>
              <label className="toggle-row">
                <span>Compact mode</span>
                <input type="checkbox" checked={appearance.compact} onChange={(event) => setAppearance({ ...appearance, compact: event.target.checked })} />
              </label>
              <label className="toggle-row">
                <span>Theme toggle</span>
                <input type="checkbox" checked={appearance.darkMode} onChange={(event) => setAppearance({ ...appearance, darkMode: event.target.checked })} />
              </label>
            </>
          )}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Settings</button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Settings;
