import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQmsuYlFQExy2q0sZDbM7yPJHRzMZgKak",
  authDomain: "digilinex-a80a9.firebaseapp.com",
  databaseURL: "https://digilinex-a80a9-default-rtdb.firebaseio.com",
  projectId: "digilinex-a80a9",
  storageBucket: "digilinex-a80a9.firebasestorage.app",
  messagingSenderId: "197674020609",
  appId: "1:197674020609:web:e9ef458ab7186edf7bf500",
  measurementId: "G-ZT73D96ZYE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function setupDatabaseMarketingCollections() {
  console.log('🚀 Setting up Database & Marketing Firebase collections...\n');

  try {
    // 1. Create sample databases collection
    console.log('📊 Creating sample databases...');
    const databases = [
      {
        category: 'business',
        package_name: 'Small - 1k contacts',
        contacts_count: 1000,
        price: 500,
        file_url: 'https://example.com/business-small-1k.csv',
        created_at: new Date().toISOString(),
        description: 'High-quality business contacts for small businesses',
        features: ['Email addresses', 'Phone numbers', 'Company names', 'Job titles']
      },
      {
        category: 'business',
        package_name: 'Medium - 5k contacts',
        contacts_count: 5000,
        price: 2000,
        file_url: 'https://example.com/business-medium-5k.csv',
        created_at: new Date().toISOString(),
        description: 'Comprehensive business database for medium businesses',
        features: ['Email addresses', 'Phone numbers', 'Company names', 'Job titles', 'Industry classification']
      },
      {
        category: 'business',
        package_name: 'Large - 10k+ contacts',
        contacts_count: 10000,
        price: 5000,
        file_url: 'https://example.com/business-large-10k.csv',
        created_at: new Date().toISOString(),
        description: 'Enterprise-level business database',
        features: ['Email addresses', 'Phone numbers', 'Company names', 'Job titles', 'Industry classification', 'Revenue data']
      },
      {
        category: 'education',
        package_name: 'Small - 1k contacts',
        contacts_count: 1000,
        price: 600,
        file_url: 'https://example.com/education-small-1k.csv',
        created_at: new Date().toISOString(),
        description: 'Educational institutions and staff contacts',
        features: ['Email addresses', 'Phone numbers', 'Institution names', 'Department info']
      },
      {
        category: 'healthcare',
        package_name: 'Medium - 5k contacts',
        contacts_count: 5000,
        price: 2500,
        file_url: 'https://example.com/healthcare-medium-5k.csv',
        created_at: new Date().toISOString(),
        description: 'Healthcare professionals and institutions',
        features: ['Email addresses', 'Phone numbers', 'Specialization', 'Hospital/clinic info']
      },
      {
        category: 'ecommerce',
        package_name: 'Large - 10k+ contacts',
        contacts_count: 10000,
        price: 4000,
        file_url: 'https://example.com/ecommerce-large-10k.csv',
        created_at: new Date().toISOString(),
        description: 'E-commerce businesses and decision makers',
        features: ['Email addresses', 'Phone numbers', 'Business type', 'Revenue range']
      }
    ];

    for (const database of databases) {
      await addDoc(collection(firestore, 'databases'), database);
      console.log(`✅ Created database: ${database.package_name}`);
    }

    // 2. Create sample marketing software collection
    console.log('\n🛠️ Creating marketing software packages...');
    const softwarePackages = [
      {
        software_id: 'marketing-software',
        name: 'Marketing Software Pro',
        description: 'Complete marketing automation suite',
        features: [
          'WhatsApp Campaign Management',
          'SMS Marketing Tools',
          'Email Automation',
          'Analytics Dashboard',
          'Contact Management',
          'Template Library'
        ],
        pricing: {
          monthly: 999,
          yearly: 9999
        },
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        software_id: 'campaign-basic',
        name: 'Campaign Basic',
        description: 'Basic campaign management tools',
        features: [
          'WhatsApp Campaigns',
          'Basic Analytics',
          'Contact Import'
        ],
        pricing: {
          monthly: 499,
          yearly: 4999
        },
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    for (const software of softwarePackages) {
      await addDoc(collection(firestore, 'marketing_software'), software);
      console.log(`✅ Created software: ${software.name}`);
    }

    // 3. Create sample database orders (for testing)
    console.log('\n📦 Creating sample database orders...');
    const sampleDatabaseOrders = [
      {
        user_id: 'sample-user-1',
        database_id: 'business-small-001',
        category: 'business',
        package_name: 'Small - 1k contacts',
        contacts_count: 1000,
        price: 500,
        status: 'completed',
        ordered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        file_url: 'https://example.com/business-small-1k.csv'
      },
      {
        user_id: 'sample-user-1',
        database_id: 'education-medium-002',
        category: 'education',
        package_name: 'Medium - 5k contacts',
        contacts_count: 5000,
        price: 2000,
        status: 'completed',
        ordered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        file_url: 'https://example.com/education-medium-5k.csv'
      }
    ];

    for (const order of sampleDatabaseOrders) {
      await addDoc(collection(firestore, 'database_orders'), order);
      console.log(`✅ Created database order: ${order.package_name}`);
    }

    // 4. Create sample software orders (for testing)
    console.log('\n💻 Creating sample software orders...');
    const sampleSoftwareOrders = [
      {
        user_id: 'sample-user-1',
        software_id: 'marketing-software',
        status: 'active',
        subscribed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        subscription_type: 'monthly',
        next_billing: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString() // 16 days from now
      }
    ];

    for (const order of sampleSoftwareOrders) {
      await addDoc(collection(firestore, 'software_orders'), order);
      console.log(`✅ Created software order: ${order.software_id}`);
    }

    // 5. Create Firestore security rules documentation
    console.log('\n🔒 Firestore Security Rules needed:');
    console.log(`
// Add these rules to your firestore.rules file:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Database & Marketing collections
    match /databases/{document} {
      allow read: if true; // Public read for database listings
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    match /database_orders/{document} {
      allow read, write: if request.auth != null && 
        (resource.data.user_id == request.auth.uid || 
         request.auth.token.role == 'admin');
    }
    
    match /marketing_software/{document} {
      allow read: if true; // Public read for software listings
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    match /software_orders/{document} {
      allow read, write: if request.auth != null && 
        (resource.data.user_id == request.auth.uid || 
         request.auth.token.role == 'admin');
    }
  }
}
    `);

    console.log('\n🎉 Database & Marketing collections setup completed successfully!');
    console.log('\n📋 Collections created:');
    console.log('  - databases (sample database packages)');
    console.log('  - marketing_software (software packages)');
    console.log('  - database_orders (user purchases)');
    console.log('  - software_orders (user subscriptions)');
    
    console.log('\n🔧 Next steps:');
    console.log('  1. Update firestore.rules with the security rules above');
    console.log('  2. Test the new Database & Marketing features');
    console.log('  3. Add payment integration for real purchases');

  } catch (error) {
    console.error('❌ Error setting up collections:', error);
  }
}

// Run the setup
setupDatabaseMarketingCollections();
