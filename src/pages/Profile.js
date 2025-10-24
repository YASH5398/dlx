import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import { auth, db } from '../firebase.ts';
import { updateProfile } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { IdentificationIcon, UserCircleIcon, EnvelopeIcon, PhoneIcon, WalletIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
export default function Profile() {
    const { user } = useUser();
    const uid = user?.id;
    const saved = useMemo(() => {
        const raw = localStorage.getItem('profile');
        return raw ? JSON.parse(raw) : {};
    }, []);
    const [name, setName] = useState(saved.name || user?.name || '');
    const [email, setEmail] = useState(user?.email || saved.email || '');
    const [phone, setPhone] = useState(saved.phone || user?.phone || '');
    const [walletAddress, setWalletAddress] = useState(saved.walletAddress || '');
    const [copied, setCopied] = useState(false);
    const referralCode = useMemo(() => {
        if (!uid)
            return 'DLX0000';
        const suffix = uid.slice(-4).toUpperCase();
        return `DLX${suffix}`;
    }, [uid]);
    const memberSince = useMemo(() => {
        const ct = auth.currentUser?.metadata?.creationTime;
        if (ct)
            return new Date(ct).toLocaleDateString();
        const ls = localStorage.getItem('memberSince');
        if (ls)
            return new Date(Number(ls)).toLocaleDateString();
        return new Date().toLocaleDateString();
    }, []);
    useEffect(() => {
        if (!localStorage.getItem('memberSince')) {
            const ct = auth.currentUser?.metadata?.creationTime;
            localStorage.setItem('memberSince', String(ct ? new Date(ct).getTime() : Date.now()));
        }
    }, []);
    const saveProfile = async () => {
        // Validate name and wallet address length if present
        if (!name.trim())
            return toast.error('Name is required');
        if (walletAddress && walletAddress.length < 8)
            return toast.error('Wallet address seems too short');
        const payload = { name: name.trim(), email, phone, walletAddress };
        localStorage.setItem('profile', JSON.stringify(payload));
        try {
            if (auth.currentUser && name.trim())
                await updateProfile(auth.currentUser, { displayName: name.trim() });
            if (uid)
                await update(ref(db, `users/${uid}/profile`), payload);
            toast.success('Profile updated successfully');
        }
        catch (e) {
            toast.success('Profile saved locally');
        }
    };
    const copyReferral = async () => {
        try {
            await navigator.clipboard.writeText(referralCode);
            setCopied(true);
            toast.success('Referral code copied');
            setTimeout(() => setCopied(false), 1200);
        }
        catch {
            toast.error('Failed to copy referral code');
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-[#0b1230] via-[#0a0e1f] to-black text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-10", children: [_jsxs("div", { className: "rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(UserCircleIcon, { className: "w-6 h-6 text-blue-300" }), _jsx("h1", { className: "text-xl md:text-2xl font-bold", children: "Profile" })] }), _jsx("p", { className: "text-gray-300 text-sm mt-2", children: "Manage your personal information and wallet details." })] }), _jsx("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5 mb-6", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(IdentificationIcon, { className: "w-5 h-5 text-gray-300" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400", children: "User ID" }), _jsx("div", { className: "text-white font-medium", children: uid || '—' })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ClipboardDocumentCheckIcon, { className: "w-5 h-5 text-gray-300" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400", children: "Referral Code" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white font-medium", children: referralCode }), _jsx(Button, { variant: "secondary", onClick: copyReferral, className: "px-2 py-1 text-xs", children: copied ? 'Copied' : 'Copy' })] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(EnvelopeIcon, { className: "w-5 h-5 text-gray-300" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400", children: "Email" }), _jsx("div", { className: "text-white font-medium", children: email || 'Not set' })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(PhoneIcon, { className: "w-5 h-5 text-gray-300" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400", children: "Phone" }), _jsx("div", { className: "text-white font-medium", children: phone || 'Not set' })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(WalletIcon, { className: "w-5 h-5 text-gray-300" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400", children: "Wallet Address" }), _jsx("div", { className: "text-white font-medium truncate max-w-[240px]", children: walletAddress || 'Not set' })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(UserCircleIcon, { className: "w-5 h-5 text-gray-300" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-400", children: "Member Since" }), _jsx("div", { className: "text-white font-medium", children: memberSince })] })] })] }) }), _jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-5", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: "Edit Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(InputField, { label: "Full Name", value: name, onChange: setName, placeholder: "Your full name" }), _jsx(InputField, { label: "Email", value: email, onChange: setEmail, placeholder: "you@example.com", type: "email" }), _jsx(InputField, { label: "Phone", value: phone, onChange: setPhone, placeholder: "Enter phone" }), _jsx(InputField, { label: "Wallet Address", value: walletAddress, onChange: setWalletAddress, placeholder: "0x...", helper: "Used for payouts and integrations" })] }), _jsx("div", { className: "mt-4 flex items-center gap-3", children: _jsx(Button, { onClick: saveProfile, children: "Save" }) })] })] }) }));
}
