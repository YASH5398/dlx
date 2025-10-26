// Comprehensive database analysis and synchronization script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';

// Firebase config (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Comprehensive form templates based on service categories and types
const getComprehensiveFormForService = (service) => {
  const category = service.category?.toLowerCase() || '';
  const title = service.title?.toLowerCase() || '';
  const serviceId = service.id?.toLowerCase() || '';

  // Token/Crypto Services
  if (category.includes('crypto') || title.includes('token') || serviceId.includes('token')) {
    return [
      {
        title: 'Token Information',
        fields: [
          { name: 'blockchain', label: 'Blockchain Network', type: 'select', required: true, options: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Avalanche', 'Arbitrum', 'Tron', 'Fantom', 'Other'] },
          { name: 'tokenName', label: 'Token Name', type: 'text', required: true, placeholder: 'Enter your token name' },
          { name: 'tokenSymbol', label: 'Token Symbol', type: 'text', required: true, placeholder: 'e.g., BTC, ETH' },
          { name: 'totalSupply', label: 'Total Supply', type: 'number', required: true, placeholder: 'e.g., 1000000' },
          { name: 'decimals', label: 'Decimals', type: 'number', required: true, placeholder: 'e.g., 18' }
        ]
      },
      {
        title: 'Token Features',
        fields: [
          { name: 'tokenFeatures', label: 'Token Features', type: 'checkbox', required: false, options: ['Burnable', 'Mintable', 'Staking', 'Governance', 'Pausable', 'Upgradeable'] },
          { name: 'icoIdo', label: 'ICO/IDO Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'airdrop', label: 'Airdrop Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'miningApp', label: 'Mining App Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Documentation & Website',
        fields: [
          { name: 'whitepaper', label: 'Whitepaper Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'roadmap', label: 'Roadmap Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'tokenWebsite', label: 'Token Website Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'auditRequired', label: 'Security Audit Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Additional Requirements',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$1000-$5000', '$5000-$15000', '$15000-$50000', '$50000+'] },
          { name: 'extraRequirements', label: 'Extra Requirements', type: 'textarea', required: false, placeholder: 'Any additional features or requirements...' }
        ]
      }
    ];
  }

  // Website Development Services
  if (category.includes('web') || title.includes('website') || title.includes('landing') || serviceId.includes('website') || serviceId.includes('landing')) {
    return [
      {
        title: 'Project Information',
        fields: [
          { name: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Corporate Website', 'E-commerce Store', 'Landing Page', 'Portfolio Website', 'Blog', 'SaaS Platform', 'Other'] },
          { name: 'pages', label: 'Number of Pages', type: 'number', required: true, placeholder: 'e.g., 5, 10, 20' },
          { name: 'designPreference', label: 'Design Preference', type: 'select', required: true, options: ['Modern', 'Minimal', 'Classic', 'Creative', 'Professional', 'Custom'] },
          { name: 'colorScheme', label: 'Preferred Color Scheme', type: 'text', required: false, placeholder: 'e.g., Blue and White, Dark Theme' }
        ]
      },
      {
        title: 'Technical Requirements',
        fields: [
          { name: 'cms', label: 'CMS Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'paymentGateway', label: 'Payment Gateway Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'seoOptimization', label: 'SEO Optimization Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'hostingDomain', label: 'Hosting/Domain Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'sslCertificate', label: 'SSL Certificate Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Features & Functionality',
        fields: [
          { name: 'userRegistration', label: 'User Registration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'contactForm', label: 'Contact Form Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'newsletter', label: 'Newsletter Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'socialMedia', label: 'Social Media Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Timeline & Budget',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$500-$2000', '$2000-$5000', '$5000-$15000', '$15000+'] },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific features or requirements...' }
        ]
      }
    ];
  }

  // Mobile App Development Services
  if (category.includes('mobile') || category.includes('app') || title.includes('mobile') || title.includes('app') || serviceId.includes('mobile')) {
    return [
      {
        title: 'App Information',
        fields: [
          { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['iOS', 'Android', 'Cross-platform (React Native)', 'Cross-platform (Flutter)', 'PWA'] },
          { name: 'appType', label: 'App Type', type: 'select', required: true, options: ['Native', 'Hybrid', 'PWA', 'Web App'] },
          { name: 'screens', label: 'Number of Screens', type: 'number', required: true, placeholder: 'e.g., 10, 20, 30' },
          { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true, placeholder: 'e.g., Young adults, Business professionals' }
        ]
      },
      {
        title: 'Features & Functionality',
        fields: [
          { name: 'pushNotifications', label: 'Push Notifications Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'inAppPurchases', label: 'In-app Purchases Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'offlineMode', label: 'Offline Mode Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'userAuthentication', label: 'User Authentication Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Deployment & Distribution',
        fields: [
          { name: 'storeDeployment', label: 'App Store Deployment Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'betaTesting', label: 'Beta Testing Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'analytics', label: 'Analytics Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Timeline & Budget',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 months', '2-4 months', '4-6 months', '6+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$2000-$10000', '$10000-$50000', '$50000-$150000', '$150000+'] },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific app features or requirements...' }
        ]
      }
    ];
  }

  // AI/ML/Automation Services
  if (category.includes('ai') || category.includes('ml') || category.includes('automation') || title.includes('ai') || title.includes('chatbot') || title.includes('automation') || serviceId.includes('chatbot') || serviceId.includes('automation')) {
    return [
      {
        title: 'AI Service Information',
        fields: [
          { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Chatbot', 'Process Automation', 'AI Integration', 'Custom AI Solution', 'Machine Learning Model', 'Data Analysis'] },
          { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Website', 'Mobile App', 'Telegram', 'WhatsApp', 'Discord', 'Multi-platform'] },
          { name: 'purpose', label: 'Purpose', type: 'select', required: true, options: ['Customer Support', 'Lead Generation', 'Process Automation', 'Data Analysis', 'Content Generation', 'Other'] }
        ]
      },
      {
        title: 'Technical Requirements',
        fields: [
          { name: 'usersExpected', label: 'Expected Number of Users', type: 'number', required: true, placeholder: 'e.g., 100, 1000, 10000' },
          { name: 'languages', label: 'Languages Supported', type: 'text', required: false, placeholder: 'e.g., English, Spanish, French' },
          { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'reporting', label: 'Reporting/Dashboard Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'customCommands', label: 'Custom Commands Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'AI Model & Training',
        fields: [
          { name: 'modelType', label: 'AI Model Type', type: 'select', required: true, options: ['Rule-based', 'LLM API (GPT, Claude)', 'Custom ML Model', 'Hybrid Approach'] },
          { name: 'trainingData', label: 'Training Data Available?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'responseType', label: 'Response Type', type: 'select', required: true, options: ['Text Only', 'Voice', 'Multi-modal (Text + Voice)', 'Interactive'] }
        ]
      },
      {
        title: 'Timeline & Budget',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$500-$2000', '$2000-$5000', '$5000-$15000', '$15000+'] },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific AI features or requirements...' }
        ]
      }
    ];
  }

  // Business/MLM Services
  if (category.includes('business') || category.includes('mlm') || title.includes('mlm') || serviceId.includes('mlm')) {
    return [
      {
        title: 'MLM System Information',
        fields: [
          { name: 'planType', label: 'MLM Plan Type', type: 'select', required: true, options: ['Binary', 'Matrix', 'Unilevel', 'Hybrid', 'Custom'] },
          { name: 'usersCount', label: 'Expected Users Count', type: 'number', required: true, placeholder: 'e.g., 100, 1000, 10000' },
          { name: 'compensation', label: 'Compensation Plan Features', type: 'checkbox', required: false, options: ['Direct Commission', 'Matching Bonus', 'Pool Bonus', 'Rank Bonus', 'Leadership Bonus'] }
        ]
      },
      {
        title: 'System Features',
        fields: [
          { name: 'multiLevelSupport', label: 'Multi-level Support Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'dashboard', label: 'Reporting Dashboard Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'payoutFrequency', label: 'Payout Frequency', type: 'select', required: true, options: ['Daily', 'Weekly', 'Monthly'] },
          { name: 'kycRequired', label: 'KYC Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Integration & Security',
        fields: [
          { name: 'paymentGateway', label: 'Payment Gateway Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'security', label: 'Security Requirements', type: 'text', required: false, placeholder: 'Any specific security requirements...' },
          { name: 'compliance', label: 'Compliance Requirements', type: 'text', required: false, placeholder: 'Any regulatory compliance needs...' }
        ]
      },
      {
        title: 'Timeline & Budget',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 months', '2-4 months', '4-6 months', '6+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$5000-$20000', '$20000-$50000', '$50000-$150000', '$150000+'] },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific MLM features or requirements...' }
        ]
      }
    ];
  }

  // Marketing Services
  if (category.includes('marketing') || title.includes('seo') || title.includes('social') || title.includes('digital') || serviceId.includes('seo') || serviceId.includes('social')) {
    return [
      {
        title: 'Marketing Information',
        fields: [
          { name: 'serviceType', label: 'Marketing Service Type', type: 'select', required: true, options: ['SEO', 'Social Media Management', 'Digital Marketing Campaigns', 'Content Marketing', 'PPC Advertising', 'Email Marketing'] },
          { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true, placeholder: 'Describe your target audience' },
          { name: 'currentWebsite', label: 'Current Website URL', type: 'text', required: false, placeholder: 'https://example.com' }
        ]
      },
      {
        title: 'Goals & Objectives',
        fields: [
          { name: 'primaryGoal', label: 'Primary Goal', type: 'select', required: true, options: ['Increase Traffic', 'Generate Leads', 'Brand Awareness', 'Sales Conversion', 'Customer Engagement'] },
          { name: 'currentMetrics', label: 'Current Metrics (if any)', type: 'text', required: false, placeholder: 'Current traffic, conversion rates, etc.' },
          { name: 'targetMetrics', label: 'Target Metrics', type: 'text', required: false, placeholder: 'Desired traffic, conversion rates, etc.' }
        ]
      },
      {
        title: 'Budget & Timeline',
        fields: [
          { name: 'budget', label: 'Monthly Budget', type: 'select', required: true, options: ['$100-$500', '$500-$1000', '$1000-$2500', '$2500+'] },
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-3 months', '3-6 months', '6-12 months', 'Ongoing'] },
          { name: 'competitors', label: 'Main Competitors', type: 'text', required: false, placeholder: 'List your main competitors' }
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific marketing requirements or preferences...' }
        ]
      }
    ];
  }

  // Security/Audit Services
  if (category.includes('security') || title.includes('audit') || serviceId.includes('audit')) {
    return [
      {
        title: 'Audit Information',
        fields: [
          { name: 'auditType', label: 'Audit Type', type: 'select', required: true, options: ['Smart Contract Audit', 'Token Audit', 'Protocol Audit', 'Security Assessment', 'Code Review'] },
          { name: 'scope', label: 'Audit Scope', type: 'text', required: true, placeholder: 'Describe what needs to be audited' },
          { name: 'network', label: 'Blockchain Network', type: 'select', required: true, options: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Other'] }
        ]
      },
      {
        title: 'Technical Details',
        fields: [
          { name: 'contracts', label: 'Number of Contracts', type: 'number', required: true, placeholder: 'e.g., 1, 5, 10' },
          { name: 'testingDepth', label: 'Testing Depth', type: 'select', required: true, options: ['Basic', 'Standard', 'Deep', 'Comprehensive'] },
          { name: 'report', label: 'Report Format', type: 'select', required: true, options: ['Summary', 'Detailed', 'Executive Summary + Detailed'] },
          { name: 'reAudit', label: 'Re-audit Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Access & Documentation',
        fields: [
          { name: 'codeAccess', label: 'Code Access', type: 'select', required: true, options: ['Public', 'Private', 'Limited Access'] },
          { name: 'docsAvailable', label: 'Documentation Available?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] }
        ]
      },
      {
        title: 'Additional Requirements',
        fields: [
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific audit requirements or concerns...' }
        ]
      }
    ];
  }

  // Bot Services (Telegram, Discord, etc.)
  if (category.includes('bot') || title.includes('bot') || title.includes('telegram') || serviceId.includes('telegram')) {
    return [
      {
        title: 'Bot Information',
        fields: [
          { name: 'botType', label: 'Bot Type', type: 'select', required: true, options: ['Utility Bot', 'Community Bot', 'Trading Bot', 'Customer Support Bot', 'Custom Bot'] },
          { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Telegram', 'Discord', 'WhatsApp', 'Slack', 'Multi-platform'] },
          { name: 'purpose', label: 'Bot Purpose', type: 'select', required: true, options: ['Customer Support', 'Lead Generation', 'Process Automation', 'Community Management', 'Trading'] }
        ]
      },
      {
        title: 'Features & Commands',
        fields: [
          { name: 'commands', label: 'Custom Commands', type: 'text', required: false, placeholder: 'List specific commands needed' },
          { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'userManagement', label: 'User Management Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'adminPanel', label: 'Admin Panel Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Technical Requirements',
        fields: [
          { name: 'notifications', label: 'Notifications Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'multiUserSupport', label: 'Multi-user Support Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'moderation', label: 'Moderation Tools Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'deployment', label: 'Deployment Platform', type: 'select', required: true, options: ['Cloud', 'On-premise', 'Hybrid'] }
        ]
      },
      {
        title: 'Timeline & Budget',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$200-$1000', '$1000-$5000', '$5000-$15000', '$15000+'] },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific bot features or requirements...' }
        ]
      }
    ];
  }

  // Default form for any other service
  return [
    {
      title: 'Service Information',
      fields: [
        { name: 'serviceType', label: 'Service Type', type: 'text', required: true, placeholder: 'Describe the specific service needed' },
        { name: 'description', label: 'Project Description', type: 'textarea', required: true, placeholder: 'Please describe your project in detail...' },
        { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
        { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$100-$500', '$500-$1000', '$1000-$2500', '$2500+'] }
      ]
    },
    {
      title: 'Requirements',
      fields: [
        { name: 'requirements', label: 'Detailed Requirements', type: 'textarea', required: true, placeholder: 'Please describe your requirements in detail...' },
        { name: 'additionalInfo', label: 'Additional Information', type: 'textarea', required: false, placeholder: 'Any additional information that might be helpful...' }
      ]
    }
  ];
};

async function analyzeAndSyncServiceForms() {
  console.log('🔍 Starting comprehensive database analysis and synchronization...\n');

  try {
    // Step 1: Get all services
    console.log('📊 Step 1: Analyzing services collection...');
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    const services = [];
    
    servicesSnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        price: data.price || '',
        icon: data.icon || '📦',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    console.log(`✅ Found ${services.length} services in database`);
    services.forEach(service => {
      console.log(`   - ${service.title} (${service.category}) - ${service.isActive ? 'Active' : 'Inactive'}`);
    });

    // Step 2: Get all existing serviceForms
    console.log('\n📋 Step 2: Analyzing serviceForms collection...');
    const serviceFormsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    const existingForms = new Map();
    
    serviceFormsSnapshot.forEach((doc) => {
      const data = doc.data();
      existingForms.set(doc.id, {
        serviceId: data.serviceId || doc.id,
        serviceTitle: data.serviceTitle || '',
        serviceCategory: data.serviceCategory || '',
        steps: data.steps || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    console.log(`✅ Found ${existingForms.size} existing serviceForms`);
    existingForms.forEach((form, id) => {
      console.log(`   - ${form.serviceTitle} (${id}) - ${form.steps.length} steps`);
    });

    // Step 3: Identify missing serviceForms
    console.log('\n🔍 Step 3: Identifying missing serviceForms...');
    const missingForms = [];
    const servicesWithForms = new Set();

    for (const service of services) {
      if (existingForms.has(service.id)) {
        servicesWithForms.add(service.id);
        console.log(`✅ ServiceForm exists for: ${service.title}`);
      } else {
        missingForms.push(service);
        console.log(`❌ Missing ServiceForm for: ${service.title} (${service.id})`);
      }
    }

    console.log(`\n📊 Analysis Results:`);
    console.log(`   - Total Services: ${services.length}`);
    console.log(`   - Services with Forms: ${servicesWithForms.size}`);
    console.log(`   - Missing Forms: ${missingForms.length}`);

    // Step 4: Create missing serviceForms
    if (missingForms.length > 0) {
      console.log(`\n🔧 Step 4: Creating ${missingForms.length} missing serviceForms...`);
      
      let createdCount = 0;
      let errorCount = 0;

      for (const service of missingForms) {
        try {
          console.log(`\n🔧 Creating serviceForm for: ${service.title}...`);
          
          // Get comprehensive form template for this service
          const formTemplate = getComprehensiveFormForService(service);
          
          // Create serviceForm document
          await setDoc(doc(firestore, 'serviceForms', service.id), {
            serviceId: service.id,
            serviceTitle: service.title,
            serviceCategory: service.category,
            steps: formTemplate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          console.log(`✅ Created serviceForm for: ${service.title}`);
          console.log(`   - Steps: ${formTemplate.length}`);
          console.log(`   - Total Fields: ${formTemplate.reduce((total, step) => total + step.fields.length, 0)}`);
          createdCount++;

        } catch (error) {
          console.error(`❌ Error creating serviceForm for ${service.title}:`, error);
          errorCount++;
        }
      }

      console.log(`\n📈 Creation Summary:`);
      console.log(`   ✅ Successfully created: ${createdCount} serviceForms`);
      console.log(`   ❌ Errors encountered: ${errorCount} serviceForms`);
    } else {
      console.log(`\n🎉 All services already have corresponding serviceForms!`);
    }

    // Step 5: Final verification
    console.log('\n🔍 Step 5: Final verification...');
    const finalFormsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    const finalFormsCount = finalFormsSnapshot.size;
    
    console.log(`✅ Final verification complete:`);
    console.log(`   - Total Services: ${services.length}`);
    console.log(`   - Total ServiceForms: ${finalFormsCount}`);
    console.log(`   - Coverage: ${((finalFormsCount / services.length) * 100).toFixed(1)}%`);

    if (finalFormsCount >= services.length) {
      console.log('\n🎉 SUCCESS: All services now have corresponding serviceForms!');
    } else {
      console.log('\n⚠️  WARNING: Some services still missing serviceForms');
    }

    // Step 6: Display sample form structure
    if (finalFormsCount > 0) {
      console.log('\n📋 Sample ServiceForm Structure:');
      const sampleForm = Array.from(existingForms.values())[0] || 
        (await getDocs(collection(firestore, 'serviceForms'))).docs[0]?.data();
      
      if (sampleForm) {
        console.log(`   Service: ${sampleForm.serviceTitle}`);
        console.log(`   Category: ${sampleForm.serviceCategory}`);
        console.log(`   Steps: ${sampleForm.steps?.length || 0}`);
        if (sampleForm.steps && sampleForm.steps.length > 0) {
          console.log(`   First Step: ${sampleForm.steps[0].title}`);
          console.log(`   First Step Fields: ${sampleForm.steps[0].fields?.length || 0}`);
        }
      }
    }

    console.log('\n🎯 Database synchronization completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test service request forms on the website');
    console.log('2. Verify all services have working forms');
    console.log('3. Check form field validation');
    console.log('4. Test form submission process');

  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    throw error;
  }
}

// Run the analysis and synchronization
analyzeAndSyncServiceForms();
