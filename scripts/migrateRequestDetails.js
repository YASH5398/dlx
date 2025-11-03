/**
 * Migration Script: Convert stringified requestDetails to JSON objects
 * 
 * This script updates all serviceRequests in Firestore where requestDetails
 * is stored as a stringified JSON string and converts it to a proper JSON object.
 * 
 * Usage:
 *   node scripts/migrateRequestDetails.js
 * 
 * Requirements:
 *   - Firebase Admin SDK initialized
 *   - Proper Firebase credentials in environment
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount = null;
const saStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (saStr) {
  try {
    serviceAccount = JSON.parse(saStr);
    if (serviceAccount?.private_key?.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch {
    serviceAccount = null;
  }
}

const credential = (serviceAccount && typeof serviceAccount.project_id === 'string')
  ? admin.credential.cert(serviceAccount)
  : admin.credential.applicationDefault();

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id,
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

async function migrateRequestDetails() {
  console.log('🚀 Starting migration of requestDetails to flat answers format...\n');
  console.log('📋 This will:');
  console.log('   1. Convert stringified JSON to objects');
  console.log('   2. Extract answers from nested { steps, answers } structure');
  console.log('   3. Flatten to direct field mapping: { emailPlatform: "...", campaignType: "...", ... }');
  console.log('');

  try {
    // Get all service requests
    const serviceRequestsRef = db.collection('serviceRequests');
    const snapshot = await serviceRequestsRef.get();

    if (snapshot.empty) {
      console.log('ℹ️  No service requests found. Nothing to migrate.');
      return;
    }

    console.log(`📊 Found ${snapshot.size} service requests to check.\n`);

    let totalChecked = 0;
    let totalConverted = 0;
    let totalErrors = 0;
    let totalAlreadyObjects = 0;
    let totalInvalid = 0;

    // Process in batches to avoid overwhelming Firestore
    const batchSize = 50;
    const batches = [];
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      batches.push(docs.slice(i, i + batchSize));
    }

    console.log(`📦 Processing ${batches.length} batch(es) of up to ${batchSize} documents each.\n`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const writeBatch = db.batch();

      console.log(`\n📝 Processing batch ${batchIndex + 1}/${batches.length}...`);

      for (const docSnapshot of batch) {
        totalChecked++;
        const data = docSnapshot.data();
        const docId = docSnapshot.id;
        const requestDetails = data.requestDetails;

        // Skip if requestDetails doesn't exist
        if (!requestDetails) {
          continue;
        }

        let parsedData = null;

        // Handle stringified JSON
        if (typeof requestDetails === 'string') {
          try {
            parsedData = JSON.parse(requestDetails);
          } catch (parseError) {
            console.error(`  ❌ Document ${docId}: Failed to parse JSON string: ${parseError.message}`);
            console.error(`     String preview: ${requestDetails.substring(0, 100)}...`);
            totalErrors++;
            continue;
          }
        } else if (typeof requestDetails === 'object' && requestDetails !== null && !Array.isArray(requestDetails)) {
          // Already an object
          parsedData = requestDetails;
        } else {
          console.warn(`  ⚠️  Document ${docId}: requestDetails is neither string nor object (type: ${typeof requestDetails}). Skipping.`);
          totalInvalid++;
          continue;
        }

        // Verify it's a valid object
        if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
          console.warn(`  ⚠️  Document ${docId}: Parsed requestDetails is not an object (type: ${typeof parsedData}). Skipping.`);
          totalInvalid++;
          continue;
        }

        // Extract and flatten answers
        let flattenedAnswers = null;

        // Check if it's the old nested format: { steps: [...], answers: {...} }
        if (parsedData.answers && typeof parsedData.answers === 'object' && !Array.isArray(parsedData.answers)) {
          // Extract just the answers object
          flattenedAnswers = parsedData.answers;
          console.log(`  🔄 Document ${docId}: Extracted answers from nested structure.`);
        } 
        // Check if it's already the new flat format (no 'answers' or 'steps' keys, just direct fields)
        else if (!parsedData.answers && !parsedData.steps) {
          // Already flat format - check if it needs any cleanup
          const hasUserFields = parsedData.fullName || parsedData.emailId || parsedData.phoneNumber;
          const hasServiceFields = Object.keys(parsedData).some(key => 
            key !== 'fullName' && key !== 'emailId' && key !== 'phoneNumber' && 
            !key.endsWith('__other')
          );
          
          if (hasUserFields || hasServiceFields) {
            // Already in flat format, but might need to remove __other fields
            flattenedAnswers = {};
            Object.keys(parsedData).forEach(key => {
              if (!key.endsWith('__other')) {
                flattenedAnswers[key] = parsedData[key];
              }
            });
            
            // Check if anything changed
            if (JSON.stringify(flattenedAnswers) === JSON.stringify(parsedData)) {
              // No changes needed, already correct format
              totalAlreadyObjects++;
              continue;
            }
          } else {
            // Doesn't look like form data, skip
            totalAlreadyObjects++;
            continue;
          }
        } else {
          // Unexpected format
          console.warn(`  ⚠️  Document ${docId}: Unexpected format. Skipping flattening.`);
          totalInvalid++;
          continue;
        }

        // Remove any __other fields or empty values
        const cleanedAnswers = {};
        Object.keys(flattenedAnswers).forEach(key => {
          const value = flattenedAnswers[key];
          // Skip __other fields, null, undefined, empty strings, empty arrays
          if (!key.endsWith('__other') && 
              value !== null && 
              value !== undefined && 
              value !== '' &&
              !(Array.isArray(value) && value.length === 0) &&
              !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
            cleanedAnswers[key] = value;
          }
        });

        // Update the document with flattened answers
        writeBatch.update(docSnapshot.ref, {
          requestDetails: cleanedAnswers
        });

        totalConverted++;
        console.log(`  ✅ Document ${docId}: Converted to flat answers format (${Object.keys(cleanedAnswers).length} fields).`);
      }

      // Commit the batch
      if (writeBatch._mutations.length > 0) {
        try {
          await writeBatch.commit();
          console.log(`  ✅ Batch ${batchIndex + 1} committed: ${writeBatch._mutations.length} update(s).`);
        } catch (batchError) {
          console.error(`  ❌ Batch ${batchIndex + 1} failed to commit: ${batchError.message}`);
          totalErrors += writeBatch._mutations.length;
          totalConverted -= writeBatch._mutations.length;
        }
      } else {
        console.log(`  ⏭️  Batch ${batchIndex + 1}: No updates needed.`);
      }

      // Small delay between batches to avoid rate limits
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total documents checked:        ${totalChecked}`);
    console.log(`🔄 Total flattened/converted:     ${totalConverted}`);
    console.log(`✅ Already flat format (skipped):  ${totalAlreadyObjects}`);
    console.log(`⚠️  Invalid format (skipped):      ${totalInvalid}`);
    console.log(`❌ Errors encountered:             ${totalErrors}`);
    console.log('='.repeat(60));

    if (totalConverted > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`   ${totalConverted} document(s) have been flattened to answer format.`);
      console.log('   Each field now appears as a top-level key in requestDetails.');
    } else if (totalAlreadyObjects > 0) {
      console.log('\n✅ All documents are already in the flat format!');
    } else {
      console.log('\n⚠️  No documents were updated. Check the logs above for details.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateRequestDetails()
    .then(() => {
      console.log('\n🎉 Script completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateRequestDetails };

