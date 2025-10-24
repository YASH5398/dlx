// Script to run initServices.ts and create all Firestore documents
import { initServices } from '../src/utils/initServices.js';
import { firestore } from '../src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function runInitialization() {
  console.log('🚀 Starting service initialization...');
  
  try {
    // Run the initServices function
    await initServices();
    
    // Verify services were created
    console.log('\n🔍 Verifying services in Firestore...');
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    const services = [];
    
    servicesSnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`\n📊 Total services found: ${services.length}`);
    
    // Check for new services specifically
    const newServiceIds = [
      'landing-page', 'ecommerce-store', 'tradingview-indicator', 
      'social-media-management', 'seo-services', 'digital-marketing-campaigns',
      'video-editing', 'daily-thumbnails', 'email-marketing-setup', 
      'whatsapp-marketing-software'
    ];
    
    const newServices = services.filter(s => newServiceIds.includes(s.id));
    console.log(`\n🎉 New services added: ${newServices.length}/10`);
    
    newServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.title} (${service.category}) - ${service.price}`);
    });
    
    // Verify service forms
    console.log('\n🔍 Verifying service forms...');
    const formsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    console.log(`📋 Service forms found: ${formsSnapshot.size}`);
    
    console.log('\n✅ Initialization completed successfully!');
    console.log('🌐 You can now visit http://localhost:5174/dashboard to see all services');
    
    return { servicesCount: services.length, newServicesCount: newServices.length };
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    throw error;
  }
}

// Run the initialization
runInitialization()
  .then((result) => {
    console.log(`\n🎯 Final Result: ${result.servicesCount} total services, ${result.newServicesCount} new services`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
