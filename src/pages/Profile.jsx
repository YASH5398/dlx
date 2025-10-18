import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import { auth, db } from '../firebase';
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
    if (!uid) return 'DLX0000';
    const suffix = uid.slice(-4).toUpperCase();
    return `DLX${suffix}`;
  }, [uid]);

  const memberSince = useMemo(() => {
    const ct = auth.currentUser?.metadata?.creationTime;
    if (ct) return new Date(ct).toLocaleDateString();
    const ls = localStorage.getItem('memberSince');
    if (ls) return new Date(Number(ls)).toLocaleDateString();
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
    if (!name.trim()) return toast.error('Name is required');
    if (walletAddress && walletAddress.length < 8) return toast.error('Wallet address seems too short');
    const payload = { name: name.trim(), email, phone, walletAddress };
    localStorage.setItem('profile', JSON.stringify(payload));
    try {
      if (auth.currentUser && name.trim()) await updateProfile(auth.currentUser, { displayName: name.trim() });
      if (uid) await update(ref(db, `users/${uid}/profile`), payload);
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.success('Profile saved locally');
    }
  };

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied');
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Failed to copy referral code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1230] via-[#0a0e1f] to-black text-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6">
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-6 h-6 text-blue-300" />
            <h1 className="text-xl md:text-2xl font-bold">Profile</h1>
          </div>
          <p className="text-gray-300 text-sm mt-2">Manage your personal information and wallet details.</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <IdentificationIcon className="w-5 h-5 text-gray-300" />
              <div>
                <div className="text-sm text-gray-400">User ID</div>
                <div className="text-white font-medium">{uid || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-300" />
              <div>
                <div className="text-sm text-gray-400">Referral Code</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{referralCode}</span>
                  <Button variant="secondary" onClick={copyReferral} className="px-2 py-1 text-xs">{copied ? 'Copied' : 'Copy'}</Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-gray-300" />
              <div>
                <div className="text-sm text-gray-400">Email</div>
                <div className="text-white font-medium">{email || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="w-5 h-5 text-gray-300" />
              <div>
                <div className="text-sm text-gray-400">Phone</div>
                <div className="text-white font-medium">{phone || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WalletIcon className="w-5 h-5 text-gray-300" />
              <div>
                <div className="text-sm text-gray-400">Wallet Address</div>
                <div className="text-white font-medium truncate max-w-[240px]">{walletAddress || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-5 h-5 text-gray-300" />
              <div>
                <div className="text-sm text-gray-400">Member Since</div>
                <div className="text-white font-medium">{memberSince}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">Edit Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" value={name} onChange={setName} placeholder="Your full name" />
            <InputField label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <InputField label="Phone" value={phone} onChange={setPhone} placeholder="Enter phone" />
            <InputField label="Wallet Address" value={walletAddress} onChange={setWalletAddress} placeholder="0x..." helper="Used for payouts and integrations" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}