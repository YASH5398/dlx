import { firestore } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

async function main() {
  console.log('[seed] Initializing Firestore...');
  try {
    const col = collection(firestore, 'serviceRequests');

    const samples = [
      {
        userId: 'user_001',
        userName: 'Alice Example',
        userEmail: 'alice@example.com',
        serviceId: 'srv_copywriting',
        serviceTitle: 'Copywriting Package',
        requestDetails: 'Need landing page copy for fintech product.',
        adminNotes: '',
        price: 0,
        status: 'pending',
        notifications: [],
        userWebsiteLink: 'https://fintech.example.com',
        userPassword: '********',
        expectedCompletion: '',
        createdAt: serverTimestamp(),
      },
      {
        userId: 'user_002',
        userName: 'Bob Test',
        userEmail: 'bob@test.com',
        serviceId: 'srv_seo',
        serviceTitle: 'SEO Optimization',
        requestDetails: 'Improve ranking for "AI tools" keyword.',
        adminNotes: '',
        price: 0,
        status: 'pending',
        notifications: [],
        userWebsiteLink: 'https://bobtools.example.com',
        userPassword: '********',
        expectedCompletion: '',
        createdAt: serverTimestamp(),
      },
    ];

    for (const s of samples) {
      const id = crypto.randomUUID();
      const ref = doc(col, id);
      await setDoc(ref, s);
      console.log(`[seed] Created serviceRequests/${id} for ${s.userEmail}`);
    }

    console.log('[seed] Completed without errors.');
  } catch (err: any) {
    console.error('[seed] Error:', err?.message || err);
    console.error('[seed] Attempting common fixes...');
    // Common fix guidance: if failure due to permissions or missing indexes, surface hint.
    // We cannot auto-change Firebase rules from client; ensure proper Firestore rules for write.
    console.error('[seed] Ensure Firestore rules permit authenticated writes or run from admin context.');
    throw err;
  }
}

main();