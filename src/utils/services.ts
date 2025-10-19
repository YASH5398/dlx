import { db } from '../firebase';
import { ref, get, set, onValue, off, update } from 'firebase/database';

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'radio' | 'email' | 'tel' | 'array';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  itemType?: Exclude<FieldType, 'array'>;
  itemLabel?: string;
}

export interface StepDef {
  title: string;
  fields: FieldDef[];
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  startingPrice?: string;
  icon?: string;
  gradient?: string;
  features?: string[];
  category?: string;
}

// Dynamic extra questions per service
function getExtraFields(serviceName: string): FieldDef[] {
  const s = serviceName.toLowerCase();
  const yesNo = ['Yes', 'No'];

  if (s.includes('token')) {
    return [
      { name: 'tokenType', label: 'Token Type', type: 'select', options: ['ERC-20', 'BEP-20', 'Custom Blockchain'] },
      { name: 'totalSupply', label: 'Total Supply', type: 'number' },
      { name: 'decimals', label: 'Decimals', type: 'number' },
      { name: 'tokenFeatures', label: 'Token Features', type: 'checkbox', options: ['Burnable', 'Mintable', 'Staking', 'Governance'] },
      { name: 'icoIdo', label: 'ICO/IDO Required?', type: 'select', options: yesNo },
      { name: 'network', label: 'Blockchain Network Preference', type: 'select', options: ['Ethereum', 'Binance Smart Chain', 'Polygon', 'Other'] },
      { name: 'auditRequired', label: 'Audit Required?', type: 'select', options: yesNo },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
      { name: 'tokenName', label: 'Token Name', type: 'text' },
      { name: 'tokenSymbol', label: 'Token Symbol', type: 'text' },
    ];
  }

  if (s.includes('website')) {
    return [
      { name: 'websiteType', label: 'Website Type', type: 'select', options: ['Corporate', 'Ecommerce', 'Portfolio', 'Blog'] },
      { name: 'pages', label: 'Number of Pages', type: 'number' },
      { name: 'cms', label: 'CMS Integration?', type: 'select', options: yesNo },
      { name: 'paymentGateway', label: 'Payment Gateway Required?', type: 'select', options: yesNo },
      { name: 'customFeatures', label: 'Custom Features Needed', type: 'text' },
      { name: 'hostingDomain', label: 'Hosting/Domain Required?', type: 'select', options: yesNo },
      { name: 'preferredTech', label: 'Preferred Technology', type: 'select', options: ['React', 'Next.js', 'WordPress', 'Other'] },
      { name: 'seoOptimization', label: 'SEO Optimization?', type: 'select', options: yesNo },
      { name: 'designPreference', label: 'Design Preference', type: 'select', options: ['Minimal', 'Modern', 'Classic', 'Custom'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  if (s.includes('chatbot')) {
    return [
      { name: 'platform', label: 'Platform', type: 'select', options: ['Website', 'Telegram', 'WhatsApp', 'Multi-platform'] },
      { name: 'purpose', label: 'Purpose', type: 'select', options: ['Customer Support', 'Lead Generation', 'Automation'] },
      { name: 'usersExpected', label: 'Number of Users Expected', type: 'number' },
      { name: 'languages', label: 'Languages Supported', type: 'text' },
      { name: 'customCommands', label: 'Custom Commands Needed?', type: 'select', options: yesNo },
      { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', options: yesNo },
      { name: 'reporting', label: 'Reporting/Dashboard Required?', type: 'select', options: yesNo },
      { name: 'responseType', label: 'Response Type', type: 'select', options: ['Text', 'Voice', 'Multi-modal'] },
      { name: 'model', label: 'AI Model Preference', type: 'select', options: ['Rule-based', 'LLM API', 'Custom ML'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  if (s.includes('mlm')) {
    return [
      { name: 'planType', label: 'Plan Type', type: 'select', options: ['Binary', 'Matrix', 'Unilevel', 'Hybrid'] },
      { name: 'usersCount', label: 'Users Count', type: 'number' },
      { name: 'compensation', label: 'Compensation Plan Features', type: 'checkbox', options: ['Direct', 'Matching', 'Pool', 'Rank Bonus'] },
      { name: 'multiLevelSupport', label: 'Multi-level Support?', type: 'select', options: yesNo },
      { name: 'dashboard', label: 'Reporting Dashboard Required?', type: 'select', options: yesNo },
      { name: 'payoutFrequency', label: 'Payout Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly'] },
      { name: 'kycRequired', label: 'KYC Required?', type: 'select', options: yesNo },
      { name: 'commissionStructure', label: 'Commission Structure', type: 'text' },
      { name: 'integrationNeeds', label: 'Integration Needs', type: 'text' },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  if (s.includes('mobile')) {
    return [
      { name: 'platform', label: 'Platform', type: 'select', options: ['iOS', 'Android', 'Cross-platform'] },
      { name: 'appType', label: 'Type', type: 'select', options: ['Native', 'Hybrid', 'PWA'] },
      { name: 'screens', label: 'Number of Screens', type: 'number' },
      { name: 'pushNotifications', label: 'Push Notifications?', type: 'select', options: yesNo },
      { name: 'inAppPurchases', label: 'In-app Purchases?', type: 'select', options: yesNo },
      { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', options: yesNo },
      { name: 'offlineMode', label: 'Offline Mode Required?', type: 'select', options: yesNo },
      { name: 'storeDeployment', label: 'App Store Deployment?', type: 'select', options: yesNo },
      { name: 'authMethod', label: 'Authentication Method', type: 'select', options: ['Email/Password', 'OAuth', 'Phone OTP'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  if (s.includes('automation')) {
    return [
      { name: 'processes', label: 'Processes to Automate', type: 'text' },
      { name: 'integrations', label: 'Integration Required (CRM, ERP, APIs)', type: 'text' },
      { name: 'workflow', label: 'Workflow Design', type: 'text' },
      { name: 'notifications', label: 'Notifications', type: 'select', options: yesNo },
      { name: 'multiUser', label: 'Multi-user Access', type: 'select', options: yesNo },
      { name: 'security', label: 'Security Requirements', type: 'text' },
      { name: 'currentSystem', label: 'Current System State', type: 'text' },
      { name: 'budget', label: 'Budget Range', type: 'select', options: ['< $1k', '$1k-$5k', '$5k-$10k', '> $10k'] },
      { name: 'timeline', label: 'Timeline', type: 'select', options: ['< 2 weeks', '2-4 weeks', '> 4 weeks'] },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  if (s.includes('telegram')) {
    return [
      { name: 'commands', label: 'Custom Commands', type: 'text' },
      { name: 'apiIntegration', label: 'API Integration', type: 'select', options: yesNo },
      { name: 'userManagement', label: 'User Management', type: 'select', options: yesNo },
      { name: 'adminPanel', label: 'Admin Panel', type: 'select', options: yesNo },
      { name: 'notifications', label: 'Notifications', type: 'select', options: yesNo },
      { name: 'multiUserSupport', label: 'Multi-user Support', type: 'select', options: yesNo },
      { name: 'botType', label: 'Bot Type', type: 'select', options: ['Utility', 'Community', 'Trading', 'Custom'] },
      { name: 'deployment', label: 'Deployment Platform', type: 'select', options: ['Cloud', 'On-prem', 'Hybrid'] },
      { name: 'moderation', label: 'Moderation Tools', type: 'select', options: yesNo },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  if (s.includes('audit')) {
    return [
      { name: 'auditType', label: 'Audit Type', type: 'select', options: ['Smart Contract', 'Token', 'Protocol'] },
      { name: 'scope', label: 'Scope', type: 'text' },
      { name: 'network', label: 'Blockchain Network', type: 'select', options: ['Ethereum', 'BSC', 'Polygon', 'Other'] },
      { name: 'contracts', label: 'Number of Contracts', type: 'number' },
      { name: 'testingDepth', label: 'Testing Depth', type: 'select', options: ['Basic', 'Standard', 'Deep'] },
      { name: 'report', label: 'Report Format', type: 'select', options: ['Summary', 'Detailed'] },
      { name: 'reAudit', label: 'Re-audit Required', type: 'select', options: yesNo },
      { name: 'codeAccess', label: 'Code Access', type: 'select', options: ['Public', 'Private'] },
      { name: 'docsAvailable', label: 'Documentation Available', type: 'select', options: yesNo },
      { name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' },
    ];
  }

  return [{ name: 'extraRequirement', label: 'Extra Requirement', type: 'textarea' }];
}

function appendExtraStep(base: StepDef[], serviceName: string): StepDef[] {
  const names = new Set<string>();
  base.forEach((s) => s.fields.forEach((f) => names.add(f.name)));
  const extras = getExtraFields(serviceName).filter((f) => !names.has(f.name));
  if (!extras.length) return base;
  const extraStep: StepDef = { title: 'Additional Requirements', fields: extras };
  return [...base, extraStep];
}

export async function restoreDefaultServiceForms(defaults: Record<string, StepDef[]>): Promise<void> {
  for (const [serviceName, steps] of Object.entries(defaults)) {
    try {
      const snap = await get(ref(db, `serviceForms/${serviceName}`));
      const val = snap.val();
      if (!val || (Array.isArray(val) && val.length === 0)) {
        await set(ref(db, `serviceForms/${serviceName}`), steps);
      }
    } catch (e) {
      console.warn('Failed to restore form for', serviceName, e);
    }
  }
}
export async function getServiceFormConfig(serviceName: string): Promise<StepDef[] | null> {
  const snap = await get(ref(db, `serviceForms/${serviceName}`));
  const val = snap.val();
  const steps = (val as StepDef[]) || null;
  // Fall back to predefined defaults when not found (handled by admin setup)
  if (!steps) return null;
  return steps;
}

export async function setServiceFormConfig(serviceName: string, steps: StepDef[]): Promise<void> {
  await set(ref(db, `serviceForms/${serviceName}`), steps);
}

export function subscribeServiceFormConfig(serviceName: string, cb: (steps: StepDef[] | null) => void): () => void {
  const r = ref(db, `serviceForms/${serviceName}`);
  const handler = (snap: any) => {
    const val = snap.val();
    const steps = val ? (val as StepDef[]) : null;
    cb(steps);
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
}

export async function getServices(): Promise<ServiceItem[]> {
  const snap = await get(ref(db, `services`));
  const val = snap.val() || {};
  const list: ServiceItem[] = Object.values(val);
  return list;
}

export async function saveService(item: ServiceItem): Promise<void> {
  const id = item.id || (globalThis.crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  await set(ref(db, `services/${id}`), { ...item, id });
}

export async function updateService(item: Partial<ServiceItem> & { id: string }): Promise<void> {
  await update(ref(db, `services/${item.id}`), item);
}

export function subscribeServices(cb: (items: ServiceItem[]) => void): () => void {
  const r = ref(db, 'services');
  const handler = (snap: any) => {
    const val = snap.val() || {};
    const list: ServiceItem[] = Object.values(val);
    cb(list);
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
}