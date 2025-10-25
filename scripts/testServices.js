// Test script to verify services are working
console.log('🧪 Testing service initialization...');

// Test the browser console method
const testServices = async () => {
  try {
    console.log('🚀 Starting service initialization test...');
    
    // Import and run the initServices function
    const { initServices } = await import('/src/utils/initServices.js');
    
    // Run the initialization
    await initServices();
    
    console.log('✅ Services initialized successfully!');
    
    // Verify services were created
    const { firestore } = await import('/src/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    console.log(`📊 Total services in Firestore: ${servicesSnapshot.size}`);
    
    // Check for new services
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
    
    console.log(`🎉 New services found: ${newServices.length}/10`);
    newServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.title} (${service.category}) - ${service.price}`);
    });
    
    // Test service forms
    const { doc, getDoc } = await import('firebase/firestore');
    const formsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    console.log(`📋 Service forms found: ${formsSnapshot.size}`);
    
    // Test specific form
    const landingPageForm = await getDoc(doc(firestore, 'serviceForms', 'landing-page'));
    if (landingPageForm.exists()) {
      console.log('✅ Landing Page form found:', landingPageForm.data());
    } else {
      console.log('❌ Landing Page form not found');
    }
    
    console.log('🔄 Reloading page to test dashboard...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testServices();

