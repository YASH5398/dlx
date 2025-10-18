import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import InputField from '../components/InputField.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import Button from '../components/Button.jsx';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, Cog6ToothIcon, UserIcon, PhotoIcon, WalletIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { user, logout, resetPassword } = useUser();
  const navigate = useNavigate();

  // Security
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFA, setTwoFA] = useState(() => JSON.parse(localStorage.getItem('security.twoFA') || 'false'));

  // Profile customization
  const savedProfile = useMemo(() => {
    const raw = localStorage.getItem('customization');
    return raw ? JSON.parse(raw) : {};
  }, []);
  const [username, setUsername] = useState(savedProfile.username || user?.name || '');
  const [bio, setBio] = useState(savedProfile.bio || '');
  const [twitter, setTwitter] = useState(savedProfile.twitter || '');
  const [telegram, setTelegram] = useState(savedProfile.telegram || '');
  const [linkedin, setLinkedin] = useState(savedProfile.linkedin || '');
  const [github, setGithub] = useState(savedProfile.github || '');
  const [avatar, setAvatar] = useState(savedProfile.avatar || '');
  const [connectedWallet, setConnectedWallet] = useState(savedProfile.connectedWallet || '');

  // Preferences
  const [theme, setTheme] = useState(localStorage.getItem('preferences.theme') || 'dark');
  const [language, setLanguage] = useState(localStorage.getItem('preferences.language') || 'English');
  const [notifEmail, setNotifEmail] = useState(() => JSON.parse(localStorage.getItem('preferences.notifEmail') || 'true'));
  const [notifSms, setNotifSms] = useState(() => JSON.parse(localStorage.getItem('preferences.notifSms') || 'false'));
  const [notifPush, setNotifPush] = useState(() => JSON.parse(localStorage.getItem('preferences.notifPush') || 'true'));

  // Privacy
  const [profileVisible, setProfileVisible] = useState(() => JSON.parse(localStorage.getItem('privacy.profileVisible') || 'true'));
  const [showEmail, setShowEmail] = useState(() => JSON.parse(localStorage.getItem('privacy.showEmail') || 'false'));
  const [showPhone, setShowPhone] = useState(() => JSON.parse(localStorage.getItem('privacy.showPhone') || 'false'));

  // Version
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    // Mock update for demo; real update requires re-auth
    localStorage.setItem('security.lastPasswordChange', String(Date.now()));
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated');
  };

  const save2FA = () => {
    localStorage.setItem('security.twoFA', JSON.stringify(twoFA));
    toast.success(`2FA ${twoFA ? 'enabled' : 'disabled'}`);
  };

  const onAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      toast.success('Profile picture updated');
    };
    reader.readAsDataURL(file);
  };

  const connectMetaMask = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum || !ethereum.request) {
        setConnectedWallet(`0x${Math.random().toString(16).slice(2, 42)}`);
        toast.success('Simulated wallet connected');
        return;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setConnectedWallet(accounts[0]);
      toast.success('Wallet connected');
    } catch (e) {
      toast.error('Failed to connect wallet');
    }
  };

  const saveProfileCustomization = () => {
    const payload = { username, bio, twitter, telegram, linkedin, github, avatar, connectedWallet };
    localStorage.setItem('customization', JSON.stringify(payload));
    toast.success('Profile customization saved');
  };

  const savePreferences = () => {
    localStorage.setItem('preferences.theme', theme);
    localStorage.setItem('preferences.language', language);
    localStorage.setItem('preferences.notifEmail', JSON.stringify(notifEmail));
    localStorage.setItem('preferences.notifSms', JSON.stringify(notifSms));
    localStorage.setItem('preferences.notifPush', JSON.stringify(notifPush));
    toast.success('Preferences saved');
  };

  const savePrivacy = () => {
    localStorage.setItem('privacy.profileVisible', JSON.stringify(profileVisible));
    localStorage.setItem('privacy.showEmail', JSON.stringify(showEmail));
    localStorage.setItem('privacy.showPhone', JSON.stringify(showPhone));
    toast.success('Privacy settings saved');
  };

  const deleteAccount = async () => {
    // For demo: log out and clear local settings
    localStorage.removeItem('profile');
    localStorage.removeItem('customization');
    localStorage.removeItem('preferences.theme');
    localStorage.removeItem('preferences.language');
    localStorage.removeItem('preferences.notifEmail');
    localStorage.removeItem('preferences.notifSms');
    localStorage.removeItem('preferences.notifPush');
    localStorage.removeItem('privacy.profileVisible');
    localStorage.removeItem('privacy.showEmail');
    localStorage.removeItem('privacy.showPhone');
    await logout();
    toast.success('Account session cleared');
    navigate('/login');
  };

  const downloadData = () => {
    const all = {
      user,
      profile: JSON.parse(localStorage.getItem('profile') || '{}'),
      customization: JSON.parse(localStorage.getItem('customization') || '{}'),
      preferences: {
        theme,
        language,
        notifEmail,
        notifSms,
        notifPush,
      },
      privacy: { profileVisible, showEmail, showPhone },
      version: appVersion,
    };
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dlx-user-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data downloaded');
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1230] via-[#0a0e1f] to-black text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="w-6 h-6 text-blue-300" />
            <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
          </div>
          <p className="text-gray-300 text-sm mt-2">Configure security, profile, preferences and privacy.</p>
        </div>

        {/* Security */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheckIcon className="w-5 h-5 text-blue-300" />
            <h2 className="text-lg font-semibold">Manage your security</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" />
            <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={changePassword}>Change Password</Button>
            <Button variant="secondary" onClick={() => user?.email && resetPassword(user.email)}>Send Reset Email</Button>
          </div>
          <div className="mt-4">
            <ToggleSwitch label="Enable 2FA" checked={twoFA} onChange={setTwoFA} helper="Adds an extra layer of security" />
            <div className="mt-2">
              <Button variant="secondary" onClick={save2FA}>Save 2FA</Button>
            </div>
          </div>
        </div>

        {/* Profile Customization */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <UserIcon className="w-5 h-5 text-blue-300" />
            <h2 className="text-lg font-semibold">Security & Connections / Profile Customization</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 overflow-hidden">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <PhotoIcon className="w-16 h-16 p-3 text-gray-400" />}
            </div>
            <label className="inline-block px-3 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20">
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
              Upload Profile Picture
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Username" value={username} onChange={setUsername} />
            <InputField label="Bio" value={bio} onChange={setBio} />
            <InputField label="Twitter" value={twitter} onChange={setTwitter} placeholder="@handle" />
            <InputField label="Telegram" value={telegram} onChange={setTelegram} />
            <InputField label="LinkedIn" value={linkedin} onChange={setLinkedin} />
            <InputField label="GitHub" value={github} onChange={setGithub} />
            <InputField label="Connected Wallet" value={connectedWallet} onChange={setConnectedWallet} placeholder="0x..." />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="secondary" onClick={connectMetaMask}><WalletIcon className="w-4 h-4" /> Connect MetaMask</Button>
            <Button onClick={saveProfileCustomization}>Save Profile</Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Theme, language and notifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white">
                <option>English</option>
                <option>Hindi</option>
              </select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleSwitch label="Email Notifications" checked={notifEmail} onChange={setNotifEmail} />
            <ToggleSwitch label="SMS Notifications" checked={notifSms} onChange={setNotifSms} />
            <ToggleSwitch label="Push Notifications" checked={notifPush} onChange={setNotifPush} />
          </div>
          <div className="mt-3">
            <Button onClick={savePreferences}>Save Preferences</Button>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Privacy Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleSwitch label="Profile Visible" checked={profileVisible} onChange={setProfileVisible} />
            <ToggleSwitch label="Show Email" checked={showEmail} onChange={setShowEmail} />
            <ToggleSwitch label="Show Phone" checked={showPhone} onChange={setShowPhone} />
          </div>
          <div className="mt-3">
            <Button onClick={savePrivacy}>Save Privacy Settings</Button>
          </div>
        </div>

        {/* Data and Utilities */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">Data and Utilities</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" onClick={() => setConfirmOpen(true)}><ExclamationTriangleIcon className="w-4 h-4" /> Delete My Account</Button>
            <Button variant="secondary" onClick={downloadData}><ArrowDownTrayIcon className="w-4 h-4" /> Download My Data</Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard/referrals')}>Invite & Earn</Button>
            <div className="text-sm text-gray-400">Version: {appVersion} · <a href="/contact" className="underline">Report a bug</a></div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 w-[90%] max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                <div className="text-lg font-semibold">Confirm Account Deletion</div>
              </div>
              <p className="text-sm text-gray-300">This action will clear your local session and log you out. For permanent deletion, contact support.</p>
              <div className="mt-4 flex items-center gap-3 justify-end">
                <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={deleteAccount}>Confirm Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}