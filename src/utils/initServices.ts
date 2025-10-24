import { firestore } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  icon?: string;
  category?: string;
  isActive?: boolean;
}

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
  options?: string[];
}

export interface StepDef {
  title: string;
  fields: FieldDef[];
}

// ====== Default Services ======
const defaultServices: ServiceItem[] = [
  { id: 'token', title: 'Token Creation', description: 'Create crypto token', price: '$100', category: 'Crypto', icon: '🪙', isActive: true },
  { id: 'website', title: 'Website Development', description: 'Build website', price: '$200', category: 'Web', icon: '🌐', isActive: true },
  { id: 'chatbot', title: 'Chatbot Development', description: 'Custom chatbot', price: '$150', category: 'Automation', icon: '🤖', isActive: true },
  { id: 'mlm', title: 'MLM Platform', description: 'Design MLM system', price: '$500', category: 'Business', icon: '📈', isActive: true },
  { id: 'mobile', title: 'Mobile App', description: 'iOS/Android app', price: '$300', category: 'App', icon: '📱', isActive: true },
  { id: 'automation', title: 'Automation', description: 'Automate processes', price: '$100', category: 'Automation', icon: '⚙️', isActive: true },
  { id: 'telegram', title: 'Telegram Bot', description: 'Custom telegram bot', price: '$80', category: 'Bot', icon: '💬', isActive: true },
  { id: 'audit', title: 'Audit', description: 'Smart contract or token audit', price: '$200', category: 'Security', icon: '🛡️', isActive: true },
  // New high-ticket services
  { id: 'landing-page', title: 'Landing Page Creation', description: 'Create a responsive and high-converting landing page with custom design, layout, and hosting-ready setup.', price: '$45 / ₹4,000', category: 'Web Development', icon: '🎨', isActive: true },
  { id: 'ecommerce-store', title: 'E-commerce Store Setup', description: 'Launch a full-featured e-commerce store with payment integration, product setup, and basic SEO optimization.', price: '$190 / ₹16,000', category: 'Web Development', icon: '🛒', isActive: true },
  { id: 'tradingview-indicator', title: 'TradingView Custom Indicator / Strategy', description: 'Get your personalized TradingView indicator or strategy with alerts and backtesting for automated trading.', price: '$30 / ₹2,500', category: 'Crypto', icon: '📈', isActive: true },
  { id: 'social-media-management', title: 'Social Media Management', description: 'Full monthly social media management with content creation, post scheduling, and engagement tracking.', price: '$20 / ₹1,700 per month', category: 'Marketing', icon: '📱', isActive: true },
  { id: 'seo-services', title: 'SEO Services', description: 'Optimize your website for better search engine visibility with technical and on-page SEO improvements.', price: '$50 / ₹4,200', category: 'Marketing', icon: '🔍', isActive: true },
  { id: 'digital-marketing-campaigns', title: 'Digital Marketing Campaigns', description: 'Setup and manage FB/IG/Google Ads campaigns with creatives, targeting, and performance tracking.', price: '$20 / ₹1,700', category: 'Marketing', icon: '📊', isActive: true },
  { id: 'video-editing', title: 'Video Editing Service', description: 'Professional video editing for YouTube, Reels, or promotional content with high-quality output.', price: '$15 / ₹1,300', category: 'Media', icon: '🎬', isActive: true },
  { id: 'daily-thumbnails', title: 'Daily Thumbnails Service', description: 'Custom thumbnail creation daily for your YouTube videos or content platform for 30/60 days.', price: '$5 / ₹450 per thumbnail', category: 'Media', icon: '🖼️', isActive: true },
  { id: 'email-marketing-setup', title: 'Automated Email Marketing Setup', description: 'Setup automated email campaigns with workflows, templates, and integrations for better engagement.', price: '$30 / ₹2,500', category: 'Marketing', icon: '📧', isActive: true },
  { id: 'whatsapp-marketing-software', title: 'WhatsApp Marketing Hidden Software', description: 'Get a cost-effective WhatsApp marketing software without API cost, fully automated for campaigns.', price: '$30 / ₹2,500', category: 'Marketing', icon: '💬', isActive: true },
];

// ====== Default Forms ======
const defaultForms: Record<string, StepDef[]> = {
  token: [
    { title: 'Basic Info', fields: [{ name: 'tokenName', label: 'Token Name', type: 'text' }, { name: 'tokenSymbol', label: 'Token Symbol', type: 'text' }] },
    { title: 'Token Details', fields: [
      { name: 'tokenType', label: 'Token Type', type: 'select', options: ['ERC-20', 'BEP-20', 'Custom Blockchain'] },
      { name: 'totalSupply', label: 'Total Supply', type: 'number' },
      { name: 'decimals', label: 'Decimals', type: 'number' },
      { name: 'tokenFeatures', label: 'Token Features', type: 'checkbox', options: ['Burnable', 'Mintable', 'Staking', 'Governance'] },
      { name: 'icoIdo', label: 'ICO/IDO Required?', type: 'select', options: ['Yes', 'No'] },
      { name: 'network', label: 'Blockchain Network Preference', type: 'select', options: ['Ethereum', 'Binance Smart Chain', 'Polygon', 'Other'] },
      { name: 'auditRequired', label: 'Audit Required?', type: 'select', options: ['Yes', 'No'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  website: [
    { title: 'Website Info', fields: [
      { name: 'websiteType', label: 'Website Type', type: 'select', options: ['Corporate', 'Ecommerce', 'Portfolio', 'Blog'] },
      { name: 'pages', label: 'Number of Pages', type: 'number' },
      { name: 'cms', label: 'CMS Integration?', type: 'select', options: ['Yes', 'No'] },
      { name: 'paymentGateway', label: 'Payment Gateway Required?', type: 'select', options: ['Yes', 'No'] },
      { name: 'hostingDomain', label: 'Hosting/Domain Required?', type: 'select', options: ['Yes', 'No'] },
      { name: 'preferredTech', label: 'Preferred Technology', type: 'select', options: ['React', 'Next.js', 'WordPress', 'Other'] },
      { name: 'seoOptimization', label: 'SEO Optimization?', type: 'select', options: ['Yes', 'No'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  chatbot: [
    { title: 'Chatbot Info', fields: [
      { name: 'platform', label: 'Platform', type: 'select', options: ['Website', 'Telegram', 'WhatsApp', 'Multi-platform'] },
      { name: 'purpose', label: 'Purpose', type: 'select', options: ['Customer Support', 'Lead Generation', 'Automation'] },
      { name: 'usersExpected', label: 'Number of Users Expected', type: 'number' },
      { name: 'languages', label: 'Languages Supported', type: 'text' },
      { name: 'customCommands', label: 'Custom Commands Needed?', type: 'select', options: ['Yes', 'No'] },
      { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', options: ['Yes', 'No'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  mlm: [
    { title: 'MLM Plan Info', fields: [
      { name: 'planType', label: 'Plan Type', type: 'select', options: ['Binary', 'Matrix', 'Unilevel', 'Hybrid'] },
      { name: 'usersCount', label: 'Users Count', type: 'number' },
      { name: 'compensation', label: 'Compensation Plan Features', type: 'checkbox', options: ['Direct', 'Matching', 'Pool', 'Rank Bonus'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  mobile: [
    { title: 'Mobile App Info', fields: [
      { name: 'platform', label: 'Platform', type: 'select', options: ['iOS', 'Android', 'Cross-platform'] },
      { name: 'appType', label: 'Type', type: 'select', options: ['Native', 'Hybrid', 'PWA'] },
      { name: 'screens', label: 'Number of Screens', type: 'number' },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  automation: [
    { title: 'Automation Info', fields: [
      { name: 'processes', label: 'Processes to Automate', type: 'text' },
      { name: 'integrations', label: 'Integration Required', type: 'text' },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  telegram: [
    { title: 'Telegram Bot Info', fields: [
      { name: 'commands', label: 'Custom Commands', type: 'text' },
      { name: 'apiIntegration', label: 'API Integration', type: 'select', options: ['Yes', 'No'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
  audit: [
    { title: 'Audit Info', fields: [
      { name: 'auditType', label: 'Audit Type', type: 'select', options: ['Smart Contract', 'Token', 'Protocol'] },
      { name: 'scope', label: 'Scope', type: 'text' },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }
    ]}
  ],
};

// ====== Main Function ======
export async function initServices() {
  console.log('Initializing default services...');
  try {
    for (const service of defaultServices) {
      await setDoc(doc(firestore, 'services', service.id), {
        title: service.title,
        description: service.description,
        category: service.category,
        icon: service.icon,
        price: service.price,
        isActive: service.isActive ?? true,
        createdAt: serverTimestamp(),
      });
      console.log(`Added service: ${service.title}`);
    }

    for (const [serviceId, steps] of Object.entries(defaultForms)) {
      await setDoc(doc(firestore, 'serviceForms', serviceId), { steps });
      console.log(`Added form for service: ${serviceId}`);
    }

    console.log('✅ All services and forms initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize services:', err);
    throw err; // Re-throw to trigger error handling in SeederButton
  }
}
