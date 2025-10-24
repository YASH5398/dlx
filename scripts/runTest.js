// Simple test command for browser console
// Copy and paste this into browser console at http://localhost:5174/dashboard

(async () => {
  console.log('🚀 Starting service initialization and verification...');
  
  try {
    // Step 1: Initialize services
    console.log('📋 Step 1: Initializing services...');
    const { initServices } = await import('/src/utils/initServices.js');
    await initServices();
    console.log('✅ Services initialized successfully!');
    
    // Step 2: Verify Firestore
    console.log('📊 Step 2: Verifying Firestore...');
    const { firestore } = await import('/src/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    console.log(`Total services: ${servicesSnapshot.size}`);
    
    // Step 3: Check for new services
    const newServiceIds = [
      'landing-page', 'ecommerce-store', 'tradingview-indicator', 
      'social-media-management', 'seo-services', 'digital-marketing-campaigns',
      'video-editing', 'daily-thumbnails', 'email-marketing-setup', 
      'whatsapp-marketing-software'
    ];
    
    const newServices = [];
    servicesSnapshot.forEach((doc) => {
      if (newServiceIds.includes(doc.id)) {
        newServices.push({ id: doc.id, ...doc.data() });
      }
    });
    
    console.log(`New services found: ${newServices.length}/10`);
    newServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.title} - ${service.price}`);
    });
    
    // Step 4: Reload page to see results
    console.log('🔄 Reloading page to display all services...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
