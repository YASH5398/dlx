import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side Firestore/Auth
// Supports two options:
// 1) Set FIREBASE_SERVICE_ACCOUNT to the JSON string of a service account
// 2) Use Application Default Credentials via GOOGLE_APPLICATION_CREDENTIALS or local emulator

function initAdmin() {
  if (admin.apps.length) return admin.app();

  const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com';

  if (svcRaw) {
    try {
      const svc = JSON.parse(svcRaw);
      return admin.initializeApp({
        credential: admin.credential.cert(svc),
        projectId: projectId || svc.project_id,
        databaseURL,
      });
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON, falling back to ADC:', e);
    }
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId,
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