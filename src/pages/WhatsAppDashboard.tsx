import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  scheduledAt?: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  createdAt: string;
  message: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
}

export default function WhatsAppDashboard() {
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Sample data
  useEffect(() => {
    const sampleCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Welcome Campaign',
        status: 'completed',
        sent: 200,
        delivered: 195,
        opened: 120,
        clicked: 45,
        createdAt: '2025-01-20T10:00:00Z',
        message: 'Welcome to our service! We\'re excited to have you on board.'
      },
      {
        id: '2',
        name: 'Product Launch',
        status: 'running',
        sent: 150,
        delivered: 145,
        opened: 89,
        clicked: 23,
        createdAt: '2025-01-22T14:30:00Z',
        message: 'Check out our new product! Limited time offer available.'
      }
    ];

    const sampleTemplates: Template[] = [
      {
        id: '1',
        name: 'Welcome Message',
        content: 'Hi {{name}}, welcome to our service! We\'re excited to have you on board.',
        variables: ['name'],
        createdAt: '2025-01-20T10:00:00Z'
      },
      {
        id: '2',
        name: 'Promotional Message',
        content: 'Get 50% off on all products! Use code {{code}} at checkout. Valid till {{date}}.',
        variables: ['code', 'date'],
        createdAt: '2025-01-21T09:00:00Z'
      }
    ];

    setCampaigns(sampleCampaigns);
    setTemplates(sampleTemplates);
  }, []);

  const handleCreateCampaign = async () => {
    if (!user || !campaignName || !campaignMessage) return;

    setLoading(true);
    try {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignName,
        status: 'draft',
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        createdAt: new Date().toISOString(),
        message: campaignMessage
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      
      setShowCreateCampaign(false);
      setCampaignName('');
      setCampaignMessage('');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !templateName || !templateContent) return;

    setLoading(true);
    try {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateName,
        content: templateContent,
        variables: [],
        createdAt: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);
      
      setShowCreateTemplate(false);
      setTemplateName('');
      setTemplateContent('');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'running': return 'text-blue-400 bg-blue-400/20';
      case 'scheduled': return 'text-yellow-400 bg-yellow-400/20';
      case 'paused': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Marketing Software
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl">💬</div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  WhatsApp Marketing Dashboard
                </h1>
                <p className="text-xl text-gray-300">
                  Manage your WhatsApp marketing campaigns
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">350</div>
            <div className="text-gray-400">Total Sent</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">340</div>
            <div className="text-gray-400">Delivered</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">209</div>
            <div className="text-gray-400">Opened</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-pink-400 mb-2">68</div>
            <div className="text-gray-400">Clicked</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => setShowCreateCampaign(true)}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
          >
            <PlusIcon className="w-5 h-5" />
            Create Campaign
          </button>
          <button
            onClick={() => setShowCreateTemplate(true)}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            <PlusIcon className="w-5 h-5" />
            Create Template
          </button>
        </div>

        {/* Campaigns List */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Campaigns</h2>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                      <p className="text-gray-400 text-sm">WhatsApp Campaign</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{campaign.sent.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{campaign.delivered.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{campaign.opened.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">{campaign.clicked.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Clicked</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Templates List */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Message Templates</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{template.content}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Variables:</span>
                  {template.variables.map((variable, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Campaign Modal */}
        {showCreateCampaign && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Create WhatsApp Campaign</h3>
                <button
                  onClick={() => setShowCreateCampaign(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message Content</label>
                  <textarea
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter your WhatsApp message..."
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <button
                  onClick={() => setShowCreateCampaign(false)}
                  className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={loading || !campaignName || !campaignMessage}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateTemplate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Create Message Template</h3>
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Content</label>
                  <textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter template content. Use {{variable}} for dynamic content..."
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={loading || !templateName || !templateContent}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
