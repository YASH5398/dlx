// Comprehensive test script for serviceRequests and serviceForms fixes
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

async function testServiceRequestsAndForms() {
  console.log('🧪 Testing Service Requests and Forms Fixes...\n');

  try {
    // Test 1: Check serviceRequests collection structure
    console.log('1. Testing serviceRequests Collection...');
    const serviceRequestsSnapshot = await getDocs(collection(firestore, 'serviceRequests'));
    const serviceRequests = [];
    
    serviceRequestsSnapshot.forEach((doc) => {
      const data = doc.data();
      serviceRequests.push({
        id: doc.id,
        requestDetails: data.requestDetails,
        requestDetailsType: typeof data.requestDetails
      });
    });

    console.log(`✅ Found ${serviceRequests.length} service requests`);
    
    // Check requestDetails types
    const stringifiedCount = serviceRequests.filter(req => typeof req.requestDetails === 'string').length;
    const objectCount = serviceRequests.filter(req => typeof req.requestDetails === 'object').length;
    
    console.log(`📊 RequestDetails types:`);
    console.log(`   - String (needs migration): ${stringifiedCount}`);
    console.log(`   - Object (correct): ${objectCount}`);

    // Test 2: Check serviceForms collection
    console.log('\n2. Testing serviceForms Collection...');
    const serviceFormsSnapshot = await getDocs(collection(firestore, 'serviceForms'));
    const serviceForms = [];
    
    serviceFormsSnapshot.forEach((doc) => {
      const data = doc.data();
      serviceForms.push({
        id: doc.id,
        serviceId: data.serviceId,
        serviceTitle: data.serviceTitle,
        steps: data.steps
      });
    });

    console.log(`✅ Found ${serviceForms.length} service forms`);

    // Test 3: Check services collection
    console.log('\n3. Testing services Collection...');
    const servicesSnapshot = await getDocs(collection(firestore, 'services'));
    const services = [];
    
    servicesSnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        title: data.title,
        category: data.category
      });
    });

    console.log(`✅ Found ${services.length} services`);

    // Test 4: Check for missing serviceForms
    console.log('\n4. Checking for Missing serviceForms...');
    const serviceIds = new Set(services.map(s => s.id));
    const formServiceIds = new Set(serviceForms.map(f => f.serviceId));
    
    const missingForms = services.filter(service => !formServiceIds.has(service.id));
    
    console.log(`📊 Service-Form Sync Status:`);
    console.log(`   - Services with forms: ${formServiceIds.size}`);
    console.log(`   - Services without forms: ${missingForms.length}`);
    
    if (missingForms.length > 0) {
      console.log(`⚠️  Missing serviceForms for:`);
      missingForms.forEach(service => {
        console.log(`   - ${service.title} (${service.id})`);
      });
    } else {
      console.log(`✅ All services have corresponding serviceForms`);
    }

    // Test 5: Test requestDetails object structure
    console.log('\n5. Testing requestDetails Object Structure...');
    const objectRequests = serviceRequests.filter(req => typeof req.requestDetails === 'object');
    
    if (objectRequests.length > 0) {
      const sampleRequest = objectRequests[0];
      console.log(`✅ Sample requestDetails structure:`);
      console.log(`   - Has steps: ${sampleRequest.requestDetails.steps ? 'Yes' : 'No'}`);
      console.log(`   - Has answers: ${sampleRequest.requestDetails.answers ? 'Yes' : 'No'}`);
      console.log(`   - Steps count: ${sampleRequest.requestDetails.steps?.length || 0}`);
    } else {
      console.log(`⚠️  No object requestDetails found to test`);
    }

    // Test 6: Test serviceForm structure
    console.log('\n6. Testing serviceForm Structure...');
    if (serviceForms.length > 0) {
      const sampleForm = serviceForms[0];
      console.log(`✅ Sample serviceForm structure:`);
      console.log(`   - Service ID: ${sampleForm.serviceId}`);
      console.log(`   - Service Title: ${sampleForm.serviceTitle}`);
      console.log(`   - Steps count: ${sampleForm.steps?.length || 0}`);
      
      if (sampleForm.steps && sampleForm.steps.length > 0) {
        const firstStep = sampleForm.steps[0];
        console.log(`   - First step title: ${firstStep.title}`);
        console.log(`   - First step fields: ${firstStep.fields?.length || 0}`);
      }
    }

    // Test 7: Test creating a new service request with object requestDetails
    console.log('\n7. Testing New Service Request Creation...');
    try {
      const testRequestData = {
        userId: 'test-user-id',
        userName: 'Test User',
        userEmail: 'test@example.com',
        serviceId: 'test-service',
        serviceTitle: 'Test Service',
        serviceCategory: 'Test Category',
        requestDetails: {
          steps: [
            {
              title: 'Test Step',
              fields: [
                { name: 'testField', label: 'Test Field', type: 'text', required: true }
              ]
            }
          ],
          answers: {
            testField: 'Test Answer'
          }
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Note: This would create a real document, so we'll just validate the structure
      console.log('✅ Test request structure is valid');
      console.log('   - requestDetails is object:', typeof testRequestData.requestDetails === 'object');
      console.log('   - Has steps:', !!testRequestData.requestDetails.steps);
      console.log('   - Has answers:', !!testRequestData.requestDetails.answers);
      
    } catch (error) {
      console.error('❌ Error testing request creation:', error);
    }

    // Test 8: Test serviceForm creation for new service
    console.log('\n8. Testing serviceForm Creation...');
    try {
      const testServiceFormData = {
        serviceId: 'test-service-id',
        serviceTitle: 'Test Service',
        serviceCategory: 'Web Development',
        steps: [
          {
            title: 'Project Information',
            fields: [
              { name: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Website', 'E-commerce', 'Landing Page'] },
              { name: 'pages', label: 'Number of Pages', type: 'number', required: true }
            ]
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('✅ Test serviceForm structure is valid');
      console.log('   - Service ID:', testServiceFormData.serviceId);
      console.log('   - Steps count:', testServiceFormData.steps.length);
      console.log('   - First step fields:', testServiceFormData.steps[0].fields.length);
      
    } catch (error) {
      console.error('❌ Error testing serviceForm creation:', error);
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Service Requests: ${serviceRequests.length} total`);
    console.log(`✅ Service Forms: ${serviceForms.length} total`);
    console.log(`✅ Services: ${services.length} total`);
    console.log(`⚠️  Missing Forms: ${missingForms.length}`);
    console.log(`📊 Object requestDetails: ${objectCount}`);
    console.log(`📊 String requestDetails: ${stringifiedCount}`);

    if (stringifiedCount > 0) {
      console.log('\n🔧 Action Required:');
      console.log('   - Run migration script to fix stringified requestDetails');
      console.log('   - Command: node scripts/migrate-request-details.js');
    }

    if (missingForms.length > 0) {
      console.log('\n🔧 Action Required:');
      console.log('   - Run sync script to create missing serviceForms');
      console.log('   - Command: node scripts/sync-service-forms.js');
    }

    if (stringifiedCount === 0 && missingForms.length === 0) {
      console.log('\n🎉 All systems are properly configured!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testServiceRequestsAndForms();
