import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, PlayIcon, PauseIcon,
  XMarkIcon, CheckIcon, ExclamationTriangleIcon, SparklesIcon
} from '@heroicons/react/24/outline';

interface MarketingSoftware {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  currency: string;
  status: 'active' | 'coming-soon';
  features: string[];
  freeTrial: {
    contacts: number;
    description: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const initialSoftware: MarketingSoftware = {
  id: '',
  name: '',
  description: '',
  icon: '💬',
  price: 0,
  currency: '$',
  status: 'coming-soon',
  features: [],
  freeTrial: {
    contacts: 0,
    description: ''
  },
  isActive: true,
  createdAt: '',
  updatedAt: ''
};

export default function AdminMarketingSoftware() {
  const { user } = useUser();
  const [softwareList, setSoftwareList] = useState<MarketingSoftware[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<MarketingSoftware | null>(null);
  const [softwareForm, setSoftwareForm] = useState<MarketingSoftware>(initialSoftware);
  const [submitting, setSubmitting] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, 'marketing_software'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedSoftware = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketingSoftware[];
      setSoftwareList(fetchedSoftware);
    } catch (error) {
      console.error('Error fetching software:', error);
      // Sample data for demo
      setSoftwareList([
        {
          id: 'whatsapp',
          name: 'WhatsApp Marketing Software',
          description: 'Send unlimited WhatsApp messages to your contacts with advanced analytics and automation',
          icon: '💬',
          price: 6,
          currency: '$',
          status: 'active',
          features: [
            'Unlimited WhatsApp messages',
            'Advanced analytics dashboard',
            'Message templates',
            'Contact management',
            'Automated campaigns',
            'Delivery tracking'
          ],
          freeTrial: {
            contacts: 200,
            description: '200 free database contacts for testing'
          },
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'telegram',
          name: 'Telegram Marketing Software',
          description: 'Powerful Telegram marketing tools for reaching your audience effectively',
          icon: '📱',
          price: 6,
          currency: '$',
          status: 'coming-soon',
          features: [
            'Telegram bot integration',
            'Channel management',
            'Bulk messaging',
            'User analytics',
            'Automated responses',
            'Campaign scheduling'
          ],
          freeTrial: {
            contacts: 200,
            description: '200 free database contacts for testing'
          },
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'facebook',
          name: 'Facebook Marketing Software',
          description: 'Comprehensive Facebook marketing suite for businesses and influencers',
          icon: '📘',
          price: 6,
          currency: '$',
          status: 'coming-soon',
          features: [
            'Facebook page management',
            'Post scheduling',
            'Audience insights',
            'Ad campaign tools',
            'Engagement tracking',
            'Content optimization'
          ],
          freeTrial: {
            contacts: 200,
            description: '200 free database contacts for testing'
          },
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!softwareForm.name || !softwareForm.description || softwareForm.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const softwareData = {
        ...softwareForm,
        updatedAt: new Date().toISOString(),
        createdAt: editingSoftware ? editingSoftware.createdAt : new Date().toISOString()
      };

      if (editingSoftware) {
        await updateDoc(doc(firestore, 'marketing_software', editingSoftware.id), softwareData);
        setSoftwareList(prev => prev.map(sw => sw.id === editingSoftware.id ? { ...softwareData, id: editingSoftware.id } : sw));
      } else {
        const docRef = await addDoc(collection(firestore, 'marketing_software'), softwareData);
        setSoftwareList(prev => [{ ...softwareData, id: docRef.id }, ...prev]);
      }

      setShowModal(false);
      setEditingSoftware(null);
      setSoftwareForm(initialSoftware);
      alert('Software saved successfully!');
    } catch (error) {
      console.error('Error saving software:', error);
      alert('Failed to save software. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (softwareId: string) => {
    if (!confirm('Are you sure you want to delete this software?')) return;

    try {
      await deleteDoc(doc(firestore, 'marketing_software', softwareId));
      setSoftwareList(prev => prev.filter(sw => sw.id !== softwareId));
      alert('Software deleted successfully!');
    } catch (error) {
      console.error('Error deleting software:', error);
      alert('Failed to delete software. Please try again.');
    }
  };

  const openModal = (software?: MarketingSoftware) => {
    if (software) {
      setEditingSoftware(software);
      setSoftwareForm(software);
    } else {
      setEditingSoftware(null);
      setSoftwareForm(initialSoftware);
    }
    setShowModal(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setSoftwareForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setSoftwareForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
        <p className="text-lg">Loading software...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Marketing Software Management
            </h1>
            <p className="text-gray-300">Manage marketing software tools and pricing</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            Add Software
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {softwareList.map((software) => (
            <div key={software.id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{software.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{software.name}</h3>
                    <p className="text-gray-300 text-sm">{software.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(software)}
                    className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors duration-300"
                    title="Edit Software"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(software.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-300"
                    title="Delete Software"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    software.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {software.status === 'active' ? 'Active' : 'Coming Soon'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-green-400 font-semibold">
                    {software.currency}{software.price}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Free Trial:</span>
                  <span className="text-blue-400 font-semibold">
                    {software.freeTrial.contacts} contacts
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-gray-400 text-sm">Features:</span>
                  <div className="space-y-1">
                    {software.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                        <CheckIcon className="w-3 h-3 text-green-400 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                    {software.features.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{software.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Software Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingSoftware ? 'Edit Software' : 'Add New Software'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Software Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={softwareForm.name}
                    onChange={(e) => setSoftwareForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., WhatsApp Marketing Software"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={softwareForm.description}
                    onChange={(e) => setSoftwareForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Describe the software features and benefits..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Icon
                    </label>
                    <input
                      type="text"
                      value={softwareForm.icon}
                      onChange={(e) => setSoftwareForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="💬"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={softwareForm.price}
                      onChange={(e) => setSoftwareForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={softwareForm.currency}
                      onChange={(e) => setSoftwareForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="$">USD ($)</option>
                      <option value="₹">INR (₹)</option>
                      <option value="€">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={softwareForm.status}
                    onChange={(e) => setSoftwareForm(prev => ({ ...prev, status: e.target.value as 'active' | 'coming-soon' }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="active">Active</option>
                    <option value="coming-soon">Coming Soon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Free Trial Contacts
                  </label>
                  <input
                    type="number"
                    value={softwareForm.freeTrial.contacts}
                    onChange={(e) => setSoftwareForm(prev => ({ 
                      ...prev, 
                      freeTrial: { ...prev.freeTrial, contacts: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Free Trial Description
                  </label>
                  <input
                    type="text"
                    value={softwareForm.freeTrial.description}
                    onChange={(e) => setSoftwareForm(prev => ({ 
                      ...prev, 
                      freeTrial: { ...prev.freeTrial, description: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="200 free database contacts for testing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Features
                  </label>
                  <div className="space-y-2">
                    {softwareForm.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-white flex-1">{feature}</span>
                        <button
                          onClick={() => removeFeature(index)}
                          className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors duration-300"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Add a feature..."
                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      />
                      <button
                        onClick={addFeature}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={softwareForm.isActive}
                    onChange={(e) => setSoftwareForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-gray-300">
                    Software is active
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Software'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
