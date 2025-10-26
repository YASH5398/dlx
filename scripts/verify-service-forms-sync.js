// Verification script to ensure all services have corresponding serviceForms
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

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

async function verifyServiceFormsSync() {
  console.log('🔍 Verifying Service-Forms synchronization...\n');

  try {
    // Get all services
    console.log('📊 Step 1: Fetching all services...');
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    const services = [];
    
    servicesSnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        title: data.title || '',
        category: data.category || '',
        isActive: data.isActive !== undefined ? data.isActive : true
      });
    });

    console.log(`✅ Found ${services.length} services`);
    console.log(`   - Active: ${services.filter(s => s.isActive).length}`);
    console.log(`   - Inactive: ${services.filter(s => !s.isActive).length}`);

    // Get all serviceForms
    console.log('\n📋 Step 2: Fetching all serviceForms...');
    const serviceFormsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    const serviceForms = [];
    
    serviceFormsSnapshot.forEach((doc) => {
      const data = doc.data();
      serviceForms.push({
        id: doc.id,
        serviceId: data.serviceId || doc.id,
        serviceTitle: data.serviceTitle || '',
        serviceCategory: data.serviceCategory || '',
        steps: data.steps || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    console.log(`✅ Found ${serviceForms.length} serviceForms`);

    // Create maps for easy lookup
    const serviceMap = new Map(services.map(s => [s.id, s]));
    const formMap = new Map(serviceForms.map(f => [f.serviceId, f]));

    // Step 3: Check synchronization
    console.log('\n🔍 Step 3: Checking synchronization...');
    
    const syncResults = {
      totalServices: services.length,
      totalForms: serviceForms.length,
      servicesWithForms: 0,
      servicesWithoutForms: 0,
      formsWithoutServices: 0,
      mismatchedForms: 0,
      coverage: 0
    };

    const issues = [];

    // Check each service
    console.log('\n📋 Checking each service:');
    for (const service of services) {
      const form = formMap.get(service.id);
      if (form) {
        syncResults.servicesWithForms++;
        console.log(`✅ ${service.title} - Has form (${form.steps.length} steps)`);
        
        // Check if form data matches service
        if (form.serviceTitle !== service.title) {
          issues.push(`⚠️  ${service.title}: Form title mismatch (${form.serviceTitle} vs ${service.title})`);
        }
        if (form.serviceCategory !== service.category) {
          issues.push(`⚠️  ${service.title}: Form category mismatch (${form.serviceCategory} vs ${service.category})`);
        }
      } else {
        syncResults.servicesWithoutForms++;
        console.log(`❌ ${service.title} - Missing form`);
        issues.push(`❌ ${service.title}: No corresponding serviceForm`);
      }
    }

    // Check for orphaned forms
    console.log('\n📋 Checking for orphaned forms:');
    for (const form of serviceForms) {
      const service = serviceMap.get(form.serviceId);
      if (!service) {
        syncResults.formsWithoutServices++;
        console.log(`⚠️  Orphaned form: ${form.serviceTitle} (${form.serviceId})`);
        issues.push(`⚠️  Orphaned form: ${form.serviceTitle} (${form.serviceId})`);
      }
    }

    // Calculate coverage
    syncResults.coverage = (syncResults.servicesWithForms / syncResults.totalServices) * 100;

    // Step 4: Display detailed results
    console.log('\n📊 Synchronization Results:');
    console.log(`   Total Services: ${syncResults.totalServices}`);
    console.log(`   Total Forms: ${syncResults.totalForms}`);
    console.log(`   Services with Forms: ${syncResults.servicesWithForms}`);
    console.log(`   Services without Forms: ${syncResults.servicesWithoutForms}`);
    console.log(`   Forms without Services: ${syncResults.formsWithoutServices}`);
    console.log(`   Coverage: ${syncResults.coverage.toFixed(1)}%`);

    // Step 5: Check form quality
    console.log('\n🔍 Step 5: Checking form quality...');
    let totalSteps = 0;
    let totalFields = 0;
    let formsWithSteps = 0;
    let formsWithoutSteps = 0;

    for (const form of serviceForms) {
      if (form.steps && form.steps.length > 0) {
        formsWithSteps++;
        totalSteps += form.steps.length;
        totalFields += form.steps.reduce((total, step) => total + (step.fields?.length || 0), 0);
      } else {
        formsWithoutSteps++;
        issues.push(`⚠️  ${form.serviceTitle}: Form has no steps`);
      }
    }

    console.log(`   Forms with Steps: ${formsWithSteps}`);
    console.log(`   Forms without Steps: ${formsWithoutSteps}`);
    console.log(`   Total Steps: ${totalSteps}`);
    console.log(`   Total Fields: ${totalFields}`);
    console.log(`   Average Steps per Form: ${(totalSteps / formsWithSteps).toFixed(1)}`);
    console.log(`   Average Fields per Form: ${(totalFields / formsWithSteps).toFixed(1)}`);

    // Step 6: Display issues
    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ No issues found!');
    }

    // Step 7: Final assessment
    console.log('\n🎯 Final Assessment:');
    if (syncResults.coverage === 100 && syncResults.formsWithoutServices === 0 && formsWithoutSteps === 0) {
      console.log('🎉 PERFECT: All services have complete, properly linked serviceForms!');
    } else if (syncResults.coverage >= 95 && issues.length <= 2) {
      console.log('✅ EXCELLENT: Almost perfect synchronization with minor issues');
    } else if (syncResults.coverage >= 90) {
      console.log('✅ GOOD: Good synchronization with some issues to address');
    } else if (syncResults.coverage >= 80) {
      console.log('⚠️  FAIR: Moderate synchronization with several issues');
    } else {
      console.log('❌ POOR: Poor synchronization with many issues');
    }

    // Step 8: Recommendations
    console.log('\n📋 Recommendations:');
    if (syncResults.servicesWithoutForms > 0) {
      console.log(`   - Run sync script to create ${syncResults.servicesWithoutForms} missing forms`);
    }
    if (syncResults.formsWithoutServices > 0) {
      console.log(`   - Clean up ${syncResults.formsWithoutServices} orphaned forms`);
    }
    if (formsWithoutSteps > 0) {
      console.log(`   - Fix ${formsWithoutSteps} forms without steps`);
    }
    if (issues.length > 0) {
      console.log(`   - Address ${issues.length} data mismatches`);
    }

    console.log('\n🎯 Verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the verification
verifyServiceFormsSync();
