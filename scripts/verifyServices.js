// Script to verify services in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// You'll need to add your Firebase config here
const firebaseConfig = {
  // Add your actual Firebase config
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function verifyServices() {
  console.log('🔍 Checking services in Firestore...');
  
  try {
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    const services = [];
    
    servicesSnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 Found ${services.length} services in Firestore:`);
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.title} (${service.category}) - ${service.price}`);
    });
    
    // Check for new services
    const newServices = services.filter(s => 
      ['landing-page', 'ecommerce-store', 'tradingview-indicator', 'social-media-management', 
       'seo-services', 'digital-marketing-campaigns', 'video-editing', 'daily-thumbnails', 
       'email-marketing-setup', 'whatsapp-marketing-software'].includes(s.id)
    );
    
    console.log(`\n🎉 New services added: ${newServices.length}/10`);
    newServices.forEach(service => {
      console.log(`✅ ${service.title}`);
    });
    
    return services.length;
  } catch (error) {
    console.error('❌ Error verifying services:', error);
    throw error;
  }
}

verifyServices()
  .then((count) => {
    console.log(`\n✅ Verification complete! ${count} services found.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
