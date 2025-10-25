import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import Button from '../../components/Button';
import InputField from '../../components/InputField.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { auth, db, firestore } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { IdentificationIcon, UserCircleIcon, EnvelopeIcon, PhoneIcon, WalletIcon, MapPinIcon, ClipboardDocumentCheckIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAffiliateApproval } from '../../hooks/useAffiliateApproval';

export default function ProfileDashboard() {
  const { user } = useUser();
  const { approved } = useAffiliateApproval();
  const uid = user?.id;

  const saved = useMemo(() => {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : {};
  }, []);

  const [name, setName] = useState<string>(saved.name || user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || saved.email || '');
  const [phone, setPhone] = useState<string>(saved.phone || user?.phone || '');
  const [walletAddress, setWalletAddress] = useState<string>(saved.walletAddress || '');
  const [location, setLocation] = useState<string>(saved.location || '');
  const [copied, setCopied] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Firestore user document fields
  const [userDoc, setUserDoc] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrerCode, setReferrerCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [activeReferrals, setActiveReferrals] = useState<number>(0);
  const [username, setUsername] = useState<string>('');

  // Fetch user document from Firestore
  useEffect(() => {
    if (!uid) return;
    
    const userRef = doc(firestore, 'users', uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data() as any || {};
      setUserDoc(data);
      setRole(data.role || 'user');
      setRank(data.rank || 'starter');
      setStatus(data.status || 'inactive');
      setReferralCode(data.referralCode || '');
      setReferrerCode(data.referrerCode || '');
      setReferralCount(data.referralCount || 0);
      setActiveReferrals(data.activeReferrals || 0);
      setUsername(data.username || '');
    }, (err) => {
      console.error('User document stream failed:', err);
    });
    
    return () => { try { unsub(); } catch {} };
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
    if (!name.trim()) return toast.error('Name is required');
    if (walletAddress && walletAddress.length < 8) return toast.error('Wallet address seems too short');
    const payload = { name: name.trim(), email, phone, walletAddress, location };
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

  const detectLocation = async () => {
    setDetecting(true);
    const setAndPersist = (loc: string) => {
      setLocation(loc);
      const raw = localStorage.getItem('profile');
      const payload = { ...(raw ? JSON.parse(raw) : {}), location: loc };
      localStorage.setItem('profile', JSON.stringify(payload));
      if (uid) update(ref(db, `users/${uid}/profile`), { location: loc }).catch(() => {});
    };
    try {
      if ('geolocation' in navigator) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
              const data = await res.json();
              const loc = data?.address ? `${data.address.city || data.address.town || data.address.village || ''}, ${data.address.state || ''}, ${data.address.country || ''}`.replace(/(^,\s*|,\s*$)/g, '') : `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
              setAndPersist(loc);
              toast.success('Location detected');
              resolve();
            } catch {
              const loc = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
              setAndPersist(loc);
              toast.success('Location detected');
              resolve();
            }
          }, (err) => {
            reject(err);
          }, { timeout: 8000 });
        });
      } else {
        throw new Error('Geolocation not available');
      }
    } catch {
      try {
        const res = await fetch('https://ipapi.co/json');
        const data = await res.json();
        const loc = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
        if (loc) {
          setAndPersist(loc);
          toast.success('Location approximated');
        } else {
          throw new Error('No IP location');
        }
      } catch {
        toast.error('Unable to detect location');
      }
    } finally {
      setDetecting(false);
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field: string) => {
    if (!uid) return;
    
    setSaving(true);
    try {
      const userRef = doc(firestore, 'users', uid);
      const updateData: any = { [field]: editValue.trim() };
      
      await updateDoc(userRef, updateData);
      
      // Update local state
      switch (field) {
        case 'phone':
          setPhone(editValue.trim());
          break;
        case 'location':
          setLocation(editValue.trim());
          break;
        case 'walletAddress':
          setWalletAddress(editValue.trim());
          break;
        case 'username':
          setUsername(editValue.trim());
          break;
      }
      
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Failed to update field. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15 mb-6">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="w-6 h-6 text-blue-300" />
          <h1 className="text-xl md:text-2xl font-bold">Profile</h1>
        </div>
        <p className="text-gray-300 text-sm mt-2">Manage your personal information, location and wallet details.</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <span className="text-white font-medium">{referralCode || 'Loading...'}</span>
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
            <UserCircleIcon className="w-5 h-5 text-gray-300" />
            <div className="flex-1">
              <div className="text-sm text-gray-400">Username</div>
              {editingField === 'username' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter username"
                    autoFocus
                  />
                  <button
                    onClick={() => saveField('username')}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-white font-medium">{username || 'Not set'}</div>
                  <button
                    onClick={() => startEditing('username', username)}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-lg transition-colors"
                  >
                    {username ? 'Edit' : 'Set'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-5 h-5 text-gray-300" />
            <div className="flex-1">
              <div className="text-sm text-gray-400">Phone</div>
              {editingField === 'phone' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                    autoFocus
                  />
                  <button
                    onClick={() => saveField('phone')}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-white font-medium">{phone || 'Not set'}</div>
                  <button
                    onClick={() => startEditing('phone', phone)}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-lg transition-colors"
                  >
                    {phone ? 'Edit' : 'Set'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Role</div>
              <div className="text-white font-medium capitalize">{role || 'Loading...'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StarIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Rank</div>
              <div className="text-white font-medium capitalize">{rank || 'Loading...'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Status</div>
              <div className={`font-medium capitalize ${
                status === 'active' ? 'text-green-400' : 
                status === 'inactive' ? 'text-yellow-400' : 
                'text-gray-400'
              }`}>
                {status || 'Loading...'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WalletIcon className="w-5 h-5 text-gray-300" />
            <div className="flex-1">
              <div className="text-sm text-gray-400">Wallet Address</div>
              {editingField === 'walletAddress' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter wallet address"
                    autoFocus
                  />
                  <button
                    onClick={() => saveField('walletAddress')}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-white font-medium truncate max-w-[240px]">{walletAddress || 'Not set'}</div>
                  <button
                    onClick={() => startEditing('walletAddress', walletAddress)}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-lg transition-colors"
                  >
                    {walletAddress ? 'Edit' : 'Set'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-5 h-5 text-gray-300" />
            <div className="flex-1">
              <div className="text-sm text-gray-400">Location</div>
              {editingField === 'location' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location"
                    autoFocus
                  />
                  <button
                    onClick={() => saveField('location')}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-white font-medium">{location || 'Not set'}</div>
                  <button
                    onClick={() => startEditing('location', location)}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-lg transition-colors"
                  >
                    {location ? 'Edit' : 'Set'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Information Card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Referral Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Your Referral Code</div>
              <div className="text-white font-medium">{referralCode || 'Loading...'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Referred By</div>
              <div className="text-white font-medium">{referrerCode || 'No referrer'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StarIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Total Referrals</div>
              <div className="text-white font-medium">{referralCount || 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Active Referrals</div>
              <div className="text-white font-medium">{activeReferrals || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Status */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-300" />
            <div>
              <div className="text-sm text-gray-400">Affiliate Partner</div>
              <div className="text-white font-medium">{approved ? 'Approved' : 'Not Approved'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {approved ? (
              <a href="/affiliate-dashboard" className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white">View Dashboard</a>
            ) : (
              <>
                <a href="/affiliate-program" className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white">Apply</a>
                <a href="/affiliate-program/info" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white">Learn More</a>
              </>
            )}
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
          <InputField label="Location" value={location} onChange={setLocation} placeholder="City, State, Country" helper="Detected or set manually" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveProfile}>Save</Button>
          <Button variant="secondary" onClick={detectLocation} className={detecting ? 'opacity-60' : ''}>{detecting ? 'Detecting...' : 'Detect Location'}</Button>
        </div>
      </div>
    </div>
  );
}