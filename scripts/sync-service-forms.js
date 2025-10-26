// Script to ensure all services have corresponding serviceForms documents
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Default form templates for different service categories
const getDefaultFormForService = (service) => {
  const category = service.category?.toLowerCase() || '';
  const title = service.title?.toLowerCase() || '';

  // Web Development services
  if (category.includes('web') || title.includes('website') || title.includes('landing')) {
    return [
      {
        title: 'Project Information',
        fields: [
          { name: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Corporate Website', 'E-commerce', 'Landing Page', 'Portfolio', 'Blog'] },
          { name: 'pages', label: 'Number of Pages', type: 'number', required: true },
          { name: 'designPreference', label: 'Design Preference', type: 'select', required: true, options: ['Modern', 'Minimal', 'Classic', 'Creative'] },
          { name: 'colorScheme', label: 'Preferred Color Scheme', type: 'text', required: false, placeholder: 'e.g., Blue and White' }
        ]
      },
      {
        title: 'Technical Requirements',
        fields: [
          { name: 'cms', label: 'CMS Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'paymentGateway', label: 'Payment Gateway Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'seoOptimization', label: 'SEO Optimization Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'hostingDomain', label: 'Hosting/Domain Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$100-$500', '$500-$1000', '$1000-$2500', '$2500+'] },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific features or requirements...' }
        ]
      }
    ];
  }

  // Mobile Development services
  if (category.includes('mobile') || title.includes('app') || title.includes('mobile')) {
    return [
      {
        title: 'App Information',
        fields: [
          { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['iOS', 'Android', 'Cross-platform'] },
          { name: 'appType', label: 'App Type', type: 'select', required: true, options: ['Native', 'Hybrid', 'PWA'] },
          { name: 'screens', label: 'Number of Screens', type: 'number', required: true },
          { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true, placeholder: 'e.g., Young adults, Business professionals' }
        ]
      },
      {
        title: 'Features & Functionality',
        fields: [
          { name: 'pushNotifications', label: 'Push Notifications Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'inAppPurchases', label: 'In-app Purchases Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'offlineMode', label: 'Offline Mode Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Deployment & Timeline',
        fields: [
          { name: 'storeDeployment', label: 'App Store Deployment Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 months', '2-4 months', '4-6 months', '6+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$1000-$5000', '$5000-$15000', '$15000-$50000', '$50000+'] }
        ]
      }
    ];
  }

  // Blockchain/Crypto services
  if (category.includes('blockchain') || category.includes('crypto') || title.includes('token') || title.includes('blockchain')) {
    return [
      {
        title: 'Token Information',
        fields: [
          { name: 'blockchain', label: 'Blockchain Network', type: 'select', required: true, options: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Other'] },
          { name: 'tokenName', label: 'Token Name', type: 'text', required: true },
          { name: 'tokenSymbol', label: 'Token Symbol', type: 'text', required: true },
          { name: 'totalSupply', label: 'Total Supply', type: 'number', required: true }
        ]
      },
      {
        title: 'Token Features',
        fields: [
          { name: 'tokenFeatures', label: 'Token Features', type: 'checkbox', required: false, options: ['Burnable', 'Mintable', 'Staking', 'Governance'] },
          { name: 'icoIdo', label: 'ICO/IDO Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'auditRequired', label: 'Security Audit Required?', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      },
      {
        title: 'Additional Requirements',
        fields: [
          { name: 'whitepaper', label: 'Whitepaper Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'website', label: 'Token Website Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$1000-$5000', '$5000-$15000', '$15000-$50000', '$50000+'] }
        ]
      }
    ];
  }

  // AI/ML services
  if (category.includes('ai') || category.includes('ml') || title.includes('ai') || title.includes('chatbot') || title.includes('automation')) {
    return [
      {
        title: 'AI Service Information',
        fields: [
          { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Chatbot', 'Automation', 'AI Integration', 'Custom AI Solution'] },
          { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Website', 'Mobile App', 'Telegram', 'WhatsApp', 'Multi-platform'] },
          { name: 'purpose', label: 'Purpose', type: 'select', required: true, options: ['Customer Support', 'Lead Generation', 'Process Automation', 'Data Analysis'] }
        ]
      },
      {
        title: 'Technical Requirements',
        fields: [
          { name: 'usersExpected', label: 'Expected Number of Users', type: 'number', required: true },
          { name: 'languages', label: 'Languages Supported', type: 'text', required: false, placeholder: 'e.g., English, Spanish, French' },
          { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] },
          { name: 'reporting', label: 'Reporting/Dashboard Required?', type: 'select', required: true, options: ['Yes', 'No'] }
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

  // Marketing services
  if (category.includes('marketing') || title.includes('seo') || title.includes('social') || title.includes('digital')) {
    return [
      {
        title: 'Marketing Information',
        fields: [
          { name: 'serviceType', label: 'Marketing Service Type', type: 'select', required: true, options: ['SEO', 'Social Media Management', 'Digital Marketing Campaigns', 'Content Marketing'] },
          { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true, placeholder: 'Describe your target audience' },
          { name: 'currentWebsite', label: 'Current Website URL', type: 'text', required: false, placeholder: 'https://example.com' }
        ]
      },
      {
        title: 'Goals & Requirements',
        fields: [
          { name: 'primaryGoal', label: 'Primary Goal', type: 'select', required: true, options: ['Increase Traffic', 'Generate Leads', 'Brand Awareness', 'Sales Conversion'] },
          { name: 'budget', label: 'Monthly Budget', type: 'select', required: true, options: ['$100-$500', '$500-$1000', '$1000-$2500', '$2500+'] },
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-3 months', '3-6 months', '6-12 months', 'Ongoing'] }
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'competitors', label: 'Main Competitors', type: 'text', required: false, placeholder: 'List your main competitors' },
          { name: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea', required: false, placeholder: 'Any specific marketing requirements...' }
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

async function syncServiceForms() {
  console.log('🔄 Starting serviceForms synchronization...\n');

  try {
    // Get all services
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    const services = [];
    
    servicesSnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        ...data
      });
    });

    console.log(`📊 Found ${services.length} services`);

    // Get existing serviceForms
    const serviceFormsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    const existingForms = new Set();
    
    serviceFormsSnapshot.forEach((doc) => {
      existingForms.add(doc.id);
    });

    console.log(`📋 Found ${existingForms.size} existing serviceForms`);

    let createdCount = 0;
    let errorCount = 0;

    for (const service of services) {
      try {
        // Check if serviceForm already exists
        if (existingForms.has(service.id)) {
          console.log(`✅ ServiceForm already exists for ${service.title}`);
          continue;
        }

        console.log(`🔧 Creating serviceForm for ${service.title}...`);
        
        // Get default form for this service
        const defaultForm = getDefaultFormForService(service);
        
        // Create serviceForm document
        await setDoc(doc(firestore, 'serviceForms', service.id), {
          serviceId: service.id,
          serviceTitle: service.title,
          serviceCategory: service.category,
          steps: defaultForm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log(`✅ Created serviceForm for ${service.title}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating serviceForm for ${service.title}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Synchronization Summary:');
    console.log(`✅ Successfully created: ${createdCount} serviceForms`);
    console.log(`❌ Errors encountered: ${errorCount} serviceForms`);
    console.log(`📊 Total services processed: ${services.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 ServiceForms synchronization completed successfully!');
    } else {
      console.log('\n⚠️  Synchronization completed with some errors. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Synchronization failed:', error);
  }
}

// Run the synchronization
syncServiceForms();
