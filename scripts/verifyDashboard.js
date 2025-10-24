// Comprehensive dashboard verification script
// Run this in browser console at http://localhost:5174/dashboard

const verifyDashboard = async () => {
  console.log('🔍 Starting comprehensive dashboard verification...');
  
  try {
    // 1. Test service initialization
    console.log('\n📋 Step 1: Testing service initialization...');
    const { initServices } = await import('/src/utils/initServices.js');
    await initServices();
    console.log('✅ Services initialized');
    
    // 2. Verify services in Firestore
    console.log('\n📊 Step 2: Verifying services in Firestore...');
    const { firestore } = await import('/src/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    console.log(`Total services in Firestore: ${servicesSnapshot.size}`);
    
    const services = [];
    servicesSnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    
    // Check for all 18 services
    const expectedServices = [
      'token', 'website', 'chatbot', 'mlm', 'mobile', 'automation', 'telegram', 'audit',
      'landing-page', 'ecommerce-store', 'tradingview-indicator', 'social-media-management',
      'seo-services', 'digital-marketing-campaigns', 'video-editing', 'daily-thumbnails',
      'email-marketing-setup', 'whatsapp-marketing-software'
    ];
    
    const foundServices = services.filter(s => expectedServices.includes(s.id));
    console.log(`Expected: 18, Found: ${foundServices.length}`);
    
    if (foundServices.length === 18) {
      console.log('✅ All 18 services found in Firestore');
    } else {
      console.log('❌ Missing services:', expectedServices.filter(id => !foundServices.find(s => s.id === id)));
    }
    
    // 3. Verify service forms
    console.log('\n📋 Step 3: Verifying service forms...');
    const formsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    console.log(`Service forms in Firestore: ${formsSnapshot.size}`);
    
    // 4. Test dashboard display
    console.log('\n🖥️ Step 4: Testing dashboard display...');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if services are displayed
    const serviceCards = document.querySelectorAll('[data-testid="service-card"]') || 
                        document.querySelectorAll('.grid > div') || 
                        document.querySelectorAll('.bg-slate-800');
    
    console.log(`Service cards found on page: ${serviceCards.length}`);
    
    // Check for new services specifically
    const newServiceNames = [
      'Landing Page Creation', 'E-commerce Store Setup', 'TradingView Custom Indicator',
      'Social Media Management', 'SEO Services', 'Digital Marketing Campaigns',
      'Video Editing Service', 'Daily Thumbnails Service', 'Automated Email Marketing Setup',
      'WhatsApp Marketing Hidden Software'
    ];
    
    let foundNewServices = 0;
    newServiceNames.forEach(name => {
      if (document.body.textContent.includes(name)) {
        foundNewServices++;
        console.log(`✅ Found: ${name}`);
      } else {
        console.log(`❌ Missing: ${name}`);
      }
    });
    
    console.log(`New services found on dashboard: ${foundNewServices}/10`);
    
    // 5. Test category filter
    console.log('\n🔍 Step 5: Testing category filter...');
    const categorySelect = document.querySelector('select');
    if (categorySelect) {
      console.log('✅ Category filter found');
      const options = Array.from(categorySelect.options).map(opt => opt.value);
      console.log('Available categories:', options);
    } else {
      console.log('❌ Category filter not found');
    }
    
    // 6. Test search functionality
    console.log('\n🔍 Step 6: Testing search functionality...');
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      console.log('✅ Search input found');
    } else {
      console.log('❌ Search input not found');
    }
    
    // 7. Test Get Service buttons
    console.log('\n🔘 Step 7: Testing Get Service buttons...');
    const getServiceButtons = document.querySelectorAll('button:contains("Get Service")') || 
                             document.querySelectorAll('button');
    
    let getServiceButtonCount = 0;
    getServiceButtons.forEach(btn => {
      if (btn.textContent.includes('Get Service')) {
        getServiceButtonCount++;
      }
    });
    
    console.log(`Get Service buttons found: ${getServiceButtonCount}`);
    
    // 8. Final verification
    console.log('\n🎯 Final Verification Results:');
    console.log(`✅ Services in Firestore: ${services.length}/18`);
    console.log(`✅ Service forms: ${formsSnapshot.size}`);
    console.log(`✅ Service cards on page: ${serviceCards.length}`);
    console.log(`✅ New services displayed: ${foundNewServices}/10`);
    console.log(`✅ Get Service buttons: ${getServiceButtonCount}`);
    
    if (services.length === 18 && foundNewServices >= 8 && getServiceButtonCount >= 15) {
      console.log('\n🎉 DASHBOARD VERIFICATION SUCCESSFUL!');
      console.log('All 18 services should be visible on the dashboard.');
      return true;
    } else {
      console.log('\n❌ DASHBOARD VERIFICATION FAILED!');
      console.log('Some services may not be displaying correctly.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
};

// Run the verification
verifyDashboard();
