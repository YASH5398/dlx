import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        if (!newPassword || newPassword.length < 6)
            return toast.error('Password must be at least 6 characters');
        if (newPassword !== confirmPassword)
            return toast.error('Passwords do not match');
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
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-[#0b1230] via-[#0a0e1f] to-black text-white", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-10", children: [_jsxs("div", { className: "rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Cog6ToothIcon, { className: "w-6 h-6 text-blue-300" }), _jsx("h1", { className: "text-xl md:text-2xl font-bold", children: "Settings" })] }), _jsx("p", { className: "text-gray-300 text-sm mt-2", children: "Configure security, profile, preferences and privacy." })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx(ShieldCheckIcon, { className: "w-5 h-5 text-blue-300" }), _jsx("h2", { className: "text-lg font-semibold", children: "Manage your security" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(InputField, { label: "New Password", value: newPassword, onChange: setNewPassword, type: "password" }), _jsx(InputField, { label: "Confirm Password", value: confirmPassword, onChange: setConfirmPassword, type: "password" })] }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsx(Button, { onClick: changePassword, children: "Change Password" }), _jsx(Button, { variant: "secondary", onClick: () => user?.email && resetPassword(user.email), children: "Send Reset Email" })] }), _jsxs("div", { className: "mt-4", children: [_jsx(ToggleSwitch, { label: "Enable 2FA", checked: twoFA, onChange: setTwoFA, helper: "Adds an extra layer of security" }), _jsx("div", { className: "mt-2", children: _jsx(Button, { variant: "secondary", onClick: save2FA, children: "Save 2FA" }) })] })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx(UserIcon, { className: "w-5 h-5 text-blue-300" }), _jsx("h2", { className: "text-lg font-semibold", children: "Security & Connections / Profile Customization" })] }), _jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-white/10 border border-white/20 overflow-hidden", children: avatar ? _jsx("img", { src: avatar, alt: "avatar", className: "w-full h-full object-cover" }) : _jsx(PhotoIcon, { className: "w-16 h-16 p-3 text-gray-400" }) }), _jsxs("label", { className: "inline-block px-3 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20", children: [_jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: onAvatarUpload }), "Upload Profile Picture"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(InputField, { label: "Username", value: username, onChange: setUsername }), _jsx(InputField, { label: "Bio", value: bio, onChange: setBio }), _jsx(InputField, { label: "Twitter", value: twitter, onChange: setTwitter, placeholder: "@handle" }), _jsx(InputField, { label: "Telegram", value: telegram, onChange: setTelegram }), _jsx(InputField, { label: "LinkedIn", value: linkedin, onChange: setLinkedin }), _jsx(InputField, { label: "GitHub", value: github, onChange: setGithub }), _jsx(InputField, { label: "Connected Wallet", value: connectedWallet, onChange: setConnectedWallet, placeholder: "0x..." })] }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsxs(Button, { variant: "secondary", onClick: connectMetaMask, children: [_jsx(WalletIcon, { className: "w-4 h-4" }), " Connect MetaMask"] }), _jsx(Button, { onClick: saveProfileCustomization, children: "Save Profile" })] })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: "Theme, language and notifications" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-1 block", children: "Theme" }), _jsxs("select", { value: theme, onChange: (e) => setTheme(e.target.value), className: "w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white", children: [_jsx("option", { value: "light", children: "Light" }), _jsx("option", { value: "dark", children: "Dark" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-1 block", children: "Language" }), _jsxs("select", { value: language, onChange: (e) => setLanguage(e.target.value), className: "w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white", children: [_jsx("option", { children: "English" }), _jsx("option", { children: "Hindi" })] })] })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(ToggleSwitch, { label: "Email Notifications", checked: notifEmail, onChange: setNotifEmail }), _jsx(ToggleSwitch, { label: "SMS Notifications", checked: notifSms, onChange: setNotifSms }), _jsx(ToggleSwitch, { label: "Push Notifications", checked: notifPush, onChange: setNotifPush })] }), _jsx("div", { className: "mt-3", children: _jsx(Button, { onClick: savePreferences, children: "Save Preferences" }) })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: "Privacy Settings" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(ToggleSwitch, { label: "Profile Visible", checked: profileVisible, onChange: setProfileVisible }), _jsx(ToggleSwitch, { label: "Show Email", checked: showEmail, onChange: setShowEmail }), _jsx(ToggleSwitch, { label: "Show Phone", checked: showPhone, onChange: setShowPhone })] }), _jsx("div", { className: "mt-3", children: _jsx(Button, { onClick: savePrivacy, children: "Save Privacy Settings" }) })] }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: "Data and Utilities" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs(Button, { variant: "danger", onClick: () => setConfirmOpen(true), children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4" }), " Delete My Account"] }), _jsxs(Button, { variant: "secondary", onClick: downloadData, children: [_jsx(ArrowDownTrayIcon, { className: "w-4 h-4" }), " Download My Data"] }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/dashboard/referrals'), children: "Invite & Earn" }), _jsxs("div", { className: "text-sm text-gray-400", children: ["Version: ", appVersion, " \u00B7 ", _jsx("a", { href: "/contact", className: "underline", children: "Report a bug" })] })] })] }), confirmOpen && (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white/10 border border-white/20 rounded-xl p-6 w-[90%] max-w-md", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(ExclamationTriangleIcon, { className: "w-6 h-6 text-red-400" }), _jsx("div", { className: "text-lg font-semibold", children: "Confirm Account Deletion" })] }), _jsx("p", { className: "text-sm text-gray-300", children: "This action will clear your local session and log you out. For permanent deletion, contact support." }), _jsxs("div", { className: "mt-4 flex items-center gap-3 justify-end", children: [_jsx(Button, { variant: "secondary", onClick: () => setConfirmOpen(false), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: deleteAccount, children: "Confirm Delete" })] })] }) }))] }) }));
}
