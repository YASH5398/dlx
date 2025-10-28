import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Button from '../../components/Button';
import { Input } from '../../components/ui/input';

// InputField wrapper component
const InputField = ({ label, value, onChange, placeholder, type = "text", helper }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="w-full"
    />
    {helper && <p className="text-xs text-gray-500">{helper}</p>}
  </div>
);

// ToggleSwitch wrapper component
const ToggleSwitch = ({ label, checked, onChange, helper }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
    {helper && <p className="text-xs text-gray-500">{helper}</p>}
  </div>
);
import toast from 'react-hot-toast';
import { ShieldCheckIcon, Cog6ToothIcon, UserIcon, PhotoIcon, WalletIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../context/I18nContext';
import { firestore } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

export default function SettingsFull() {
  const { user, logout, resetPassword } = useUser();
  const navigate = useNavigate();
  const { language: i18nLanguage, setLanguage: setI18nLanguage, t } = useI18n();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFA, setTwoFA] = useState(() => JSON.parse(localStorage.getItem('security.twoFA') || 'false'));

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

  // Firestore user document fields
  const [userDoc, setUserDoc] = useState<any>(null);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('English');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  // Fetch user document from Firestore
  useEffect(() => {
    if (!user?.id) return;
    
    const userRef = doc(firestore, 'users', user.id);
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data() as any || {};
      setUserDoc(data);
      const preferences = data.preferences || {};
      setTheme(preferences.theme || 'dark');
      setLanguage(preferences.language || 'English');
      setNotifEmail(preferences.notifEmail ?? true);
      setNotifSms(preferences.notifSms ?? false);
      setNotifPush(preferences.notifPush ?? true);
    }, (err) => {
      console.error('User document stream failed:', err);
    });
    
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  const [profileVisible, setProfileVisible] = useState(() => JSON.parse(localStorage.getItem('privacy.profileVisible') || 'true'));
  const [showEmail, setShowEmail] = useState(() => JSON.parse(localStorage.getItem('privacy.showEmail') || 'false'));
  const [showPhone, setShowPhone] = useState(() => JSON.parse(localStorage.getItem('privacy.showPhone') || 'false'));

  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    localStorage.setItem('security.lastPasswordChange', String(Date.now()));
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated');
  };

  const save2FA = () => {
    localStorage.setItem('security.twoFA', JSON.stringify(twoFA));
    toast.success(`2FA ${twoFA ? 'enabled' : 'disabled'}`);
  };

  const onAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      toast.success('Profile picture updated');
    };
    reader.readAsDataURL(file);
  };

  const connectMetaMask = async () => {
    try {
      const { ethereum } = window as any;
      
      // Check if MetaMask is installed
      if (!ethereum || !ethereum.request) {
        toast.error('MetaMask extension not found. Please install MetaMask to connect your wallet.');
        return;
      }
      
      // Check if MetaMask is already connected
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setConnectedWallet(accounts[0]);
        toast.success('Wallet already connected');
        return;
      }
      
      // Request connection
      const newAccounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (newAccounts.length > 0) {
        setConnectedWallet(newAccounts[0]);
        toast.success('Wallet connected successfully');
      } else {
        toast.error('No accounts found');
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.code === -32002) {
        toast.error('Connection request already pending. Please check MetaMask.');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Connection rejected by user');
      } else if (error.message?.includes('extension not found')) {
        toast.error('MetaMask extension not found. Please install MetaMask.');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    }
  };

  const saveProfileCustomization = () => {
    const payload = { username, bio, twitter, telegram, linkedin, github, avatar, connectedWallet };
    localStorage.setItem('customization', JSON.stringify(payload));
    toast.success('Profile customization saved');
  };

  const savePreferences = async () => {
    if (!user?.id) return;
    
    try {
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        'preferences.theme': theme,
        'preferences.language': language,
        'preferences.notifEmail': notifEmail,
        'preferences.notifSms': notifSms,
        'preferences.notifPush': notifPush
      });
      toast.success('Preferences saved to Firestore');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const savePrivacy = () => {
    localStorage.setItem('privacy.profileVisible', JSON.stringify(profileVisible));
    localStorage.setItem('privacy.showEmail', JSON.stringify(showEmail));
    localStorage.setItem('privacy.showPhone', JSON.stringify(showPhone));
    toast.success('Privacy settings saved');
  };

  const deleteAccount = async () => {
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
  const [deleteStep, setDeleteStep] = useState<number>(0);

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-3 lg:px-4 py-6">
      <div className="rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6">
        <div className="flex items-center gap-3">
          <Cog6ToothIcon className="w-6 h-6 text-blue-300" />
          <h1 className="text-xl md:text-2xl font-bold">{t('settings_title')}</h1>
        </div>
        <p className="text-gray-300 text-sm mt-2">{t('settings_subtitle')}</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheckIcon className="w-5 h-5 text-blue-300" />
          <h2 className="text-lg font-semibold">{t('security_heading')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label={t('new_password')} value={newPassword} onChange={setNewPassword} type="password" />
          <InputField label={t('confirm_password')} value={confirmPassword} onChange={setConfirmPassword} type="password" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={changePassword}>{t('change_password')}</Button>
          <Button variant="secondary" onClick={() => user?.email && resetPassword(user.email)}>{t('send_reset_email')}</Button>
        </div>
        <div className="mt-4">
          <ToggleSwitch label={t('enable_2fa')} checked={twoFA} onChange={setTwoFA} helper="Adds an extra layer of security" />
          <div className="mt-2">
            <Button variant="secondary" onClick={save2FA}>{t('save_2fa')}</Button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <UserIcon className="w-5 h-5 text-blue-300" />
          <h2 className="text-lg font-semibold">{t('profile_customization')}</h2>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 overflow-hidden">
            {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <PhotoIcon className="w-16 h-16 p-3 text-gray-400" />}
          </div>
          <label className="inline-block px-3 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20">
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
            {t('upload_profile_picture')}
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label={t('username')} value={username} onChange={setUsername} />
          <InputField label={t('bio')} value={bio} onChange={setBio} />
          <InputField label={t('twitter')} value={twitter} onChange={setTwitter} placeholder="@handle" />
          <InputField label={t('telegram')} value={telegram} onChange={setTelegram} />
          <InputField label={t('linkedin')} value={linkedin} onChange={setLinkedin} />
          <InputField label={t('github')} value={github} onChange={setGithub} />
          <InputField label={t('connected_wallet')} value={connectedWallet} onChange={setConnectedWallet} placeholder="0x..." />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button variant="secondary" onClick={connectMetaMask}><WalletIcon className="w-4 h-4" /> {t('connect_metamask')}</Button>
          <Button onClick={saveProfileCustomization}>{t('save_profile')}</Button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('theme_language_notifications')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">{t('theme')}</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white">
              <option value="light">{t('light')}</option>
              <option value="dark">{t('dark')}</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">{t('language')}</label>
            <select value={i18nLanguage} onChange={(e) => setI18nLanguage(e.target.value as any)} className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white">
              <option value="English">{t('english')}</option>
              <option value="Hindi">{t('hindi')}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ToggleSwitch label={t('email_notifications')} checked={notifEmail} onChange={setNotifEmail} />
          <ToggleSwitch label={t('sms_notifications')} checked={notifSms} onChange={setNotifSms} />
          <ToggleSwitch label={t('push_notifications')} checked={notifPush} onChange={setNotifPush} />
        </div>
        <div className="mt-3">
          <Button onClick={savePreferences}>{t('save_preferences')}</Button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('privacy_settings')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ToggleSwitch label={t('profile_visible')} checked={profileVisible} onChange={setProfileVisible} />
          <ToggleSwitch label={t('show_email')} checked={showEmail} onChange={setShowEmail} />
          <ToggleSwitch label={t('show_phone')} checked={showPhone} onChange={setShowPhone} />
        </div>
        <div className="mt-3">
          <Button onClick={savePrivacy}>{t('save_privacy')}</Button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">{t('data_utilities')}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => { setDeleteStep(0); setConfirmOpen(true); }} className="text-red-400 border border-red-400/40 hover:bg-red-500/10"><ExclamationTriangleIcon className="w-4 h-4" /> {t('delete_account')}</Button>
          <Button variant="secondary" onClick={downloadData}><ArrowDownTrayIcon className="w-4 h-4" /> {t('download_data')}</Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard/referrals')}>{t('invite_earn')}</Button>
          <div className="text-sm text-gray-400">Version: {appVersion} · <a href="/contact" className="underline">{t('report_bug')}</a></div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 w-[90%] max-w-md">
            <div className="flex items-center gap-3 mb-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              <div className="text-lg font-semibold">{deleteStep === 0 ? t('confirm_yes') : deleteStep === 1 ? t('confirm_are_you_sure') : t('confirm_final')}</div>
            </div>
            <p className="text-sm text-gray-300">{t('confirm_delete_desc')}</p>
            <div className="mt-4 flex items-center gap-3 justify-end">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>{t('cancel')}</Button>
              {deleteStep < 2 ? (
                <Button variant="secondary" onClick={() => setDeleteStep((s: number) => s + 1)} className="text-red-400 border border-red-400/40 hover:bg-red-500/10">{deleteStep === 0 ? t('confirm_yes') : t('confirm_are_you_sure')}</Button>
              ) : (
                <Button variant="secondary" onClick={deleteAccount} className="text-red-400 border border-red-400/40 hover:bg-red-500/10">{t('confirm_delete')}</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}