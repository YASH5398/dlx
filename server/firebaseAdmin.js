import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side Firestore/Auth
// Supports two options:
// 1) Set FIREBASE_SERVICE_ACCOUNT to the JSON string of a service account
// 2) Use Application Default Credentials via GOOGLE_APPLICATION_CREDENTIALS or local emulator

function initAdmin() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com';

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
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