// Migration script to fix stringified requestDetails in serviceRequests collection
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

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

async function migrateRequestDetails() {
  console.log('🔄 Starting requestDetails migration...\n');

  try {
    // Get all service requests
    const serviceRequestsSnapshot = await getDocs(collection(firestore, 'serviceRequests'));
    const serviceRequests = [];
    
    serviceRequestsSnapshot.forEach((doc) => {
      const data = doc.data();
      serviceRequests.push({
        id: doc.id,
        ...data
      });
    });

    console.log(`📊 Found ${serviceRequests.length} service requests to check`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const request of serviceRequests) {
      try {
        // Check if requestDetails is a string (needs migration)
        if (typeof request.requestDetails === 'string') {
          console.log(`🔧 Migrating request ${request.id}...`);
          
          // Parse the stringified JSON
          let parsedDetails;
          try {
            parsedDetails = JSON.parse(request.requestDetails);
          } catch (parseError) {
            console.warn(`⚠️  Failed to parse requestDetails for ${request.id}:`, parseError.message);
            errorCount++;
            continue;
          }

          // Update the document with parsed object
          await updateDoc(doc(firestore, 'serviceRequests', request.id), {
            requestDetails: parsedDetails
          });

          console.log(`✅ Migrated request ${request.id}`);
          migratedCount++;
        } else {
          console.log(`✅ Request ${request.id} already has object requestDetails`);
        }
      } catch (error) {
        console.error(`❌ Error migrating request ${request.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} requests`);
    console.log(`❌ Errors encountered: ${errorCount} requests`);
    console.log(`📊 Total processed: ${serviceRequests.length} requests`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateRequestDetails();
