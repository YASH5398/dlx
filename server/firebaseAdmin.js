import 'dotenv/config';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side Firestore/Auth
// Supports two options:
// 1) Set FIREBASE_SERVICE_ACCOUNT_KEY to the JSON string of a service account
// 2) Use Application Default Credentials via GOOGLE_APPLICATIONS_CREDENTIALS or local ADC

function initAdmin() {
  if (admin.apps.length) return admin.app();

  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com';

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

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id;

  return admin.initializeApp({
    credential,
    projectId,
    databaseURL,
  });
}

export const adminApp = initAdmin();
export const auth = admin.auth(adminApp);
export const firestore = admin.firestore(adminApp);
export const rtdb = admin.database(adminApp);

// Common helpers for Firestore collections used in the server
export const col = (name) => firestore.collection(name);
export const doc = (name, id) => firestore.collection(name).doc(id);