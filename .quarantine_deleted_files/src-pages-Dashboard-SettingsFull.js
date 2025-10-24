import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Button from '../../components/Button';
import InputField from '../../components/InputField.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, Cog6ToothIcon, UserIcon, PhotoIcon, WalletIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../context/I18nContext';
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
    const [theme, setTheme] = useState(localStorage.getItem('preferences.theme') || 'dark');
    const [language, setLanguage] = useState(localStorage.getItem('preferences.language') || 'English');
    const [notifEmail, setNotifEmail] = useState(() => JSON.parse(localStorage.getItem('preferences.notifEmail') || 'true'));
    const [notifSms, setNotifSms] = useState(() => JSON.parse(localStorage.getItem('preferences.notifSms') || 'false'));
    const [notifPush, setNotifPush] = useState(() => JSON.parse(localStorage.getItem('preferences.notifPush') || 'true'));
    const [profileVisible, setProfileVisible] = useState(() => JSON.parse(localStorage.getItem('privacy.profileVisible') || 'true'));
    const [showEmail, setShowEmail] = useState(() => JSON.parse(localStorage.getItem('privacy.showEmail') || 'false'));
    const [showPhone, setShowPhone] = useState(() => JSON.parse(localStorage.getItem('privacy.showPhone') || 'false'));
    const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.0';
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);
    const changePassword = async () => {
        if (!newPassword || newPassword.length < 6)
            return toast.error('Password must be at least 6 characters');
        if (newPassword !== confirmPassword)
            return toast.error('Passwords do not match');
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
        if (!file)
            return;
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
        }
        catch (e) {
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
    const [deleteStep, setDeleteStep] = useState(0);
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-2 md:px-3 lg:px-4 py-6", children: [_jsxs("div", { className: "rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Cog6ToothIcon, { className: "w-6 h-6 text-blue-300" }), _jsx("h1", { className: "text-xl md:text-2xl font-bold", children: t('settings_title') })] }), _jsx("p", { className: "text-gray-300 text-sm mt-2", children: t('settings_subtitle') })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx(ShieldCheckIcon, { className: "w-5 h-5 text-blue-300" }), _jsx("h2", { className: "text-lg font-semibold", children: t('security_heading') })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(InputField, { label: t('new_password'), value: newPassword, onChange: setNewPassword, type: "password" }), _jsx(InputField, { label: t('confirm_password'), value: confirmPassword, onChange: setConfirmPassword, type: "password" })] }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsx(Button, { onClick: changePassword, children: t('change_password') }), _jsx(Button, { variant: "secondary", onClick: () => user?.email && resetPassword(user.email), children: t('send_reset_email') })] }), _jsxs("div", { className: "mt-4", children: [_jsx(ToggleSwitch, { label: t('enable_2fa'), checked: twoFA, onChange: setTwoFA, helper: "Adds an extra layer of security" }), _jsx("div", { className: "mt-2", children: _jsx(Button, { variant: "secondary", onClick: save2FA, children: t('save_2fa') }) })] })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx(UserIcon, { className: "w-5 h-5 text-blue-300" }), _jsx("h2", { className: "text-lg font-semibold", children: t('profile_customization') })] }), _jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-white/10 border border-white/20 overflow-hidden", children: avatar ? _jsx("img", { src: avatar, alt: "avatar", className: "w-full h-full object-cover" }) : _jsx(PhotoIcon, { className: "w-16 h-16 p-3 text-gray-400" }) }), _jsxs("label", { className: "inline-block px-3 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20", children: [_jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: onAvatarUpload }), t('upload_profile_picture')] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(InputField, { label: t('username'), value: username, onChange: setUsername }), _jsx(InputField, { label: t('bio'), value: bio, onChange: setBio }), _jsx(InputField, { label: t('twitter'), value: twitter, onChange: setTwitter, placeholder: "@handle" }), _jsx(InputField, { label: t('telegram'), value: telegram, onChange: setTelegram }), _jsx(InputField, { label: t('linkedin'), value: linkedin, onChange: setLinkedin }), _jsx(InputField, { label: t('github'), value: github, onChange: setGithub }), _jsx(InputField, { label: t('connected_wallet'), value: connectedWallet, onChange: setConnectedWallet, placeholder: "0x..." })] }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsxs(Button, { variant: "secondary", onClick: connectMetaMask, children: [_jsx(WalletIcon, { className: "w-4 h-4" }), " ", t('connect_metamask')] }), _jsx(Button, { onClick: saveProfileCustomization, children: t('save_profile') })] })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: t('theme_language_notifications') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-1 block", children: t('theme') }), _jsxs("select", { value: theme, onChange: (e) => setTheme(e.target.value), className: "w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white", children: [_jsx("option", { value: "light", children: t('light') }), _jsx("option", { value: "dark", children: t('dark') })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-1 block", children: t('language') }), _jsxs("select", { value: i18nLanguage, onChange: (e) => setI18nLanguage(e.target.value), className: "w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white", children: [_jsx("option", { value: "English", children: t('english') }), _jsx("option", { value: "Hindi", children: t('hindi') })] })] })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(ToggleSwitch, { label: t('email_notifications'), checked: notifEmail, onChange: setNotifEmail }), _jsx(ToggleSwitch, { label: t('sms_notifications'), checked: notifSms, onChange: setNotifSms }), _jsx(ToggleSwitch, { label: t('push_notifications'), checked: notifPush, onChange: setNotifPush })] }), _jsx("div", { className: "mt-3", children: _jsx(Button, { onClick: savePreferences, children: t('save_preferences') }) })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: t('privacy_settings') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(ToggleSwitch, { label: t('profile_visible'), checked: profileVisible, onChange: setProfileVisible }), _jsx(ToggleSwitch, { label: t('show_email'), checked: showEmail, onChange: setShowEmail }), _jsx(ToggleSwitch, { label: t('show_phone'), checked: showPhone, onChange: setShowPhone })] }), _jsx("div", { className: "mt-3", children: _jsx(Button, { onClick: savePrivacy, children: t('save_privacy') }) })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: t('data_utilities') }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs(Button, { variant: "secondary", onClick: () => { setDeleteStep(0); setConfirmOpen(true); }, className: "text-red-400 border border-red-400/40 hover:bg-red-500/10", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4" }), " ", t('delete_account')] }), _jsxs(Button, { variant: "secondary", onClick: downloadData, children: [_jsx(ArrowDownTrayIcon, { className: "w-4 h-4" }), " ", t('download_data')] }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/dashboard/referrals'), children: t('invite_earn') }), _jsxs("div", { className: "text-sm text-gray-400", children: ["Version: ", appVersion, " \u00B7 ", _jsx("a", { href: "/contact", className: "underline", children: t('report_bug') })] })] })] }), confirmOpen && (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white/10 border border-white/20 rounded-xl p-6 w-[90%] max-w-md", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(ExclamationTriangleIcon, { className: "w-6 h-6 text-red-400" }), _jsx("div", { className: "text-lg font-semibold", children: deleteStep === 0 ? t('confirm_yes') : deleteStep === 1 ? t('confirm_are_you_sure') : t('confirm_final') })] }), _jsx("p", { className: "text-sm text-gray-300", children: t('confirm_delete_desc') }), _jsxs("div", { className: "mt-4 flex items-center gap-3 justify-end", children: [_jsx(Button, { variant: "secondary", onClick: () => setConfirmOpen(false), children: t('cancel') }), deleteStep < 2 ? (_jsx(Button, { variant: "secondary", onClick: () => setDeleteStep((s) => s + 1), className: "text-red-400 border border-red-400/40 hover:bg-red-500/10", children: deleteStep === 0 ? t('confirm_yes') : t('confirm_are_you_sure') })) : (_jsx(Button, { variant: "secondary", onClick: deleteAccount, className: "text-red-400 border border-red-400/40 hover:bg-red-500/10", children: t('confirm_delete') }))] })] }) }))] }));
}
