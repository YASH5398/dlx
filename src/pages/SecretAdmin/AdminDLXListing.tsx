import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  RocketLaunchIcon,
  DocumentTextIcon,
  ShareIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DLXListingData {
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  tokenStats: {
    name: string;
    listingPrice: string;
    totalSupply: string;
    circulatingSupply: string;
    blockchain: string;
    decimals: string;
  };
  tokenomics: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  roadmap: Array<{
    phase: string;
    status: 'completed' | 'current' | 'upcoming' | 'future';
    title: string;
    items: string[];
    color: string;
  }>;
  community: Array<{
    name: string;
    url: string;
    color: string;
  }>;
  whitepaper: {
    url: string;
    enabled: boolean;
  };
}

const AdminDLXListing = () => {
  const [dlxData, setDlxData] = useState<DLXListingData>({
    countdown: {
      days: 230,
      hours: 0,
      minutes: 0,
      seconds: 0
    },
    tokenStats: {
      name: 'DLX (Digi Linex Token)',
      listingPrice: '$0.20',
      totalSupply: '20,000,000 DLX',
      circulatingSupply: '5,000,000 DLX',
      blockchain: 'Binance Smart Chain',
      decimals: '18'
    },
    tokenomics: [
      { name: 'Public Sale', percentage: 40, color: 'from-blue-500 to-cyan-500' },
      { name: 'Team & Advisors', percentage: 15, color: 'from-purple-500 to-pink-500' },
      { name: 'Marketing & Partnerships', percentage: 10, color: 'from-green-500 to-emerald-500' },
      { name: 'Staking Rewards', percentage: 20, color: 'from-orange-500 to-red-500' },
      { name: 'Reserve & Liquidity', percentage: 10, color: 'from-yellow-500 to-orange-500' },
      { name: 'Development', percentage: 5, color: 'from-indigo-500 to-blue-500' }
    ],
    roadmap: [
      {
        phase: 'Phase 1',
        status: 'completed',
        title: 'Foundation',
        items: ['DLX Token Concept', 'Smart Contract Deployment', 'Initial Wallet Integration'],
        color: 'from-green-500 to-emerald-500'
      },
      {
        phase: 'Phase 2',
        status: 'current',
        title: 'Development',
        items: ['DigiLinex App Integration', 'Mining & Referral System', 'Countdown Launch'],
        color: 'from-blue-500 to-cyan-500'
      },
      {
        phase: 'Phase 3',
        status: 'upcoming',
        title: 'Launch',
        items: ['Public Sale & Listing ($0.20)', 'Exchange Partnerships', 'DLX Staking & Rewards'],
        color: 'from-purple-500 to-pink-500'
      },
      {
        phase: 'Phase 4',
        status: 'future',
        title: 'Expansion',
        items: ['DLX Wallet Launch', 'International Marketing Push', 'Web3 Expansion'],
        color: 'from-orange-500 to-red-500'
      }
    ],
    community: [
      { name: 'Telegram', url: '#', color: 'from-blue-500 to-cyan-500' },
      { name: 'Twitter/X', url: '#', color: 'from-blue-400 to-blue-600' },
      { name: 'Discord', url: '#', color: 'from-purple-500 to-pink-500' },
      { name: 'Website', url: '#', color: 'from-green-500 to-emerald-500' }
    ],
    whitepaper: {
      url: '#',
      enabled: true
    }
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>(null);

  const handleEdit = (section: string, data: any) => {
    setEditingSection(section);
    setTempData({ ...data });
  };

  const handleSave = () => {
    if (editingSection && tempData) {
      setDlxData(prev => ({
        ...prev,
        [editingSection]: tempData
      }));
      setEditingSection(null);
      setTempData(null);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setTempData(null);
  };

  const handleInputChange = (field: string, value: any) => {
    if (tempData) {
      setTempData((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayItemChange = (index: number, field: string, value: any) => {
    if (tempData && Array.isArray(tempData)) {
      const newArray = [...tempData];
      newArray[index] = { ...newArray[index], [field]: value };
      setTempData(newArray);
    }
  };

  const addArrayItem = (template: any) => {
    if (tempData && Array.isArray(tempData)) {
      setTempData([...tempData, template]);
    }
  };

  const removeArrayItem = (index: number) => {
    if (tempData && Array.isArray(tempData)) {
      setTempData(tempData.filter((_, i) => i !== index));
    }
  };

  const EditableCard = ({ title, children, section, data }: { title: string; children: React.ReactNode; section: string; data: any }) => (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <button
          onClick={() => handleEdit(section, data)}
          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  );

  const EditModal = () => {
    if (!editingSection || !tempData) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit {editingSection}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {editingSection === 'countdown' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Days</label>
                  <input
                    type="number"
                    value={tempData.days}
                    onChange={(e) => handleInputChange('days', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hours</label>
                  <input
                    type="number"
                    value={tempData.hours}
                    onChange={(e) => handleInputChange('hours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minutes</label>
                  <input
                    type="number"
                    value={tempData.minutes}
                    onChange={(e) => handleInputChange('minutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Seconds</label>
                  <input
                    type="number"
                    value={tempData.seconds}
                    onChange={(e) => handleInputChange('seconds', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {editingSection === 'tokenStats' && (
              <>
                {Object.entries(tempData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </>
            )}

            {editingSection === 'tokenomics' && (
              <div className="space-y-4">
                {tempData.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleArrayItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Percentage</label>
                        <input
                          type="number"
                          value={item.percentage}
                          onChange={(e) => handleArrayItemChange(index, 'percentage', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => handleArrayItemChange(index, 'color', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeArrayItem(index)}
                      className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem({ name: '', percentage: 0, color: 'from-gray-500 to-gray-600' })}
                  className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Add Tokenomics Item
                </button>
              </div>
            )}

            {editingSection === 'roadmap' && (
              <div className="space-y-4">
                {tempData.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phase</label>
                        <input
                          type="text"
                          value={item.phase}
                          onChange={(e) => handleArrayItemChange(index, 'phase', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                        <select
                          value={item.status}
                          onChange={(e) => handleArrayItemChange(index, 'status', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="completed">Completed</option>
                          <option value="current">Current</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="future">Future</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleArrayItemChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => handleArrayItemChange(index, 'color', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Items (one per line)</label>
                      <textarea
                        value={item.items.join('\n')}
                        onChange={(e) => handleArrayItemChange(index, 'items', e.target.value.split('\n'))}
                        className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                      />
                    </div>
                    <button
                      onClick={() => removeArrayItem(index)}
                      className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem({ 
                    phase: '', 
                    status: 'future', 
                    title: '', 
                    items: [''], 
                    color: 'from-gray-500 to-gray-600' 
                  })}
                  className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Add Roadmap Phase
                </button>
              </div>
            )}

            {editingSection === 'community' && (
              <div className="space-y-4">
                {tempData.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleArrayItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                        <input
                          type="url"
                          value={item.url}
                          onChange={(e) => handleArrayItemChange(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => handleArrayItemChange(index, 'color', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeArrayItem(index)}
                      className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem({ name: '', url: '#', color: 'from-gray-500 to-gray-600' })}
                  className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Add Community Link
                </button>
              </div>
            )}

            {editingSection === 'whitepaper' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                  <input
                    type="url"
                    value={tempData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tempData.enabled}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-300">Enable Whitepaper Download</label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            DLX Listing Management
          </h1>
          <p className="text-gray-300 text-lg">
            Manage all aspects of the DLX Token listing page content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EditableCard title="Countdown Timer" section="countdown" data={dlxData.countdown}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Days:</span>
                <span className="text-white font-semibold">{dlxData.countdown.days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Hours:</span>
                <span className="text-white font-semibold">{dlxData.countdown.hours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Minutes:</span>
                <span className="text-white font-semibold">{dlxData.countdown.minutes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Seconds:</span>
                <span className="text-white font-semibold">{dlxData.countdown.seconds}</span>
              </div>
            </div>
          </EditableCard>

          <EditableCard title="Token Statistics" section="tokenStats" data={dlxData.tokenStats}>
            <div className="space-y-2">
              {Object.entries(dlxData.tokenStats).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-white font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </EditableCard>

          <EditableCard title="Tokenomics" section="tokenomics" data={dlxData.tokenomics}>
            <div className="space-y-2">
              {dlxData.tokenomics.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300">{item.name}:</span>
                  <span className="text-white font-semibold">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </EditableCard>

          <EditableCard title="Roadmap" section="roadmap" data={dlxData.roadmap}>
            <div className="space-y-3">
              {dlxData.roadmap.map((phase, index) => (
                <div key={index} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">{phase.phase}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      phase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      phase.status === 'current' ? 'bg-blue-500/20 text-blue-400' :
                      phase.status === 'upcoming' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {phase.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm">{phase.title}</div>
                </div>
              ))}
            </div>
          </EditableCard>

          <EditableCard title="Community Links" section="community" data={dlxData.community}>
            <div className="space-y-2">
              {dlxData.community.map((link, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300">{link.name}:</span>
                  <span className="text-white font-semibold">{link.url}</span>
                </div>
              ))}
            </div>
          </EditableCard>

          <EditableCard title="Whitepaper" section="whitepaper" data={dlxData.whitepaper}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">URL:</span>
                <span className="text-white font-semibold">{dlxData.whitepaper.url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Enabled:</span>
                <span className={`font-semibold ${dlxData.whitepaper.enabled ? 'text-green-400' : 'text-red-400'}`}>
                  {dlxData.whitepaper.enabled ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </EditableCard>
        </div>

        <EditModal />
      </div>
    </div>
  );
};

export default AdminDLXListing;
