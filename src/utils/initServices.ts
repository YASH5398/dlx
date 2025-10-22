import { firestore } from '../firebase.ts';
import { doc, setDoc } from 'firebase/firestore';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  startingPrice?: string;
  icon?: string;
  category?: string;
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
  { id: 'token', name: 'Token Creation', description: 'Create crypto token', startingPrice: '100$', category: 'Crypto', icon: '🪙' },
  { id: 'website', name: 'Website Development', description: 'Build website', startingPrice: '200$', category: 'Web', icon: '🌐' },
  { id: 'chatbot', name: 'Chatbot Development', description: 'Custom chatbot', startingPrice: '150$', category: 'Automation', icon: '🤖' },
  { id: 'mlm', name: 'MLM Platform', description: 'Design MLM system', startingPrice: '500$', category: 'Business', icon: '📈' },
  { id: 'mobile', name: 'Mobile App', description: 'iOS/Android app', startingPrice: '300$', category: 'App', icon: '📱' },
  { id: 'automation', name: 'Automation', description: 'Automate processes', startingPrice: '100$', category: 'Automation', icon: '⚙️' },
  { id: 'telegram', name: 'Telegram Bot', description: 'Custom telegram bot', startingPrice: '80$', category: 'Bot', icon: '💬' },
  { id: 'audit', name: 'Audit', description: 'Smart contract or token audit', startingPrice: '200$', category: 'Security', icon: '🛡️' },
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
      await setDoc(doc(firestore, 'services', service.id), service);
      console.log(`Added service: ${service.name}`);
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
