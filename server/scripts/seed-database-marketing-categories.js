// Seed script for Firestore: databaseMarketingCategories
// Fields: name, description, image, priceRange, contactCount, category, createdAt
import admin from 'firebase-admin';
import { firestore } from '../firebaseAdmin.js';

async function run() {
  const opts = admin.app().options || {};
  const projectId = opts.projectId || process.env.FIREBASE_PROJECT_ID;
  console.log(`[seed] Using projectId: ${projectId || 'unknown'}`);
  const col = firestore.collection('databaseMarketingCategories');

  const docs = [
    {
      name: 'Real Estate',
      description: 'Verified contacts of property agents and developers.',
      image: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80',
      priceINR: '₹600–4000',
      priceUSD: '$8–48',
      priceRange: '₹600–4000',
      contactCount: 18000,
      category: 'real-estate',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'E-commerce',
      description: 'Owners and managers of online stores.',
      image: 'https://images.unsplash.com/photo-1556742400-b5cc6a1e53d2?q=80',
      priceINR: '₹800–3500',
      priceUSD: '$10–42',
      priceRange: '₹800–3500',
      contactCount: 22000,
      category: 'ecommerce',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'Crypto Investors',
      description: 'High-intent investors and traders contact data.',
      image: 'https://images.unsplash.com/photo-1621811984309-97dfec0e7f9e?q=80',
      priceINR: '₹1000–5000',
      priceUSD: '$12–60',
      priceRange: '₹1000–5000',
      contactCount: 12000,
      category: 'crypto-investors',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'Startups',
      description: 'Founders and co-founders database.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80',
      priceINR: '₹700–3200',
      priceUSD: '$9–38',
      priceRange: '₹700–3200',
      contactCount: 9000,
      category: 'startups',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'Health Professionals',
      description: 'Doctors, clinics, and health practitioners.',
      image: 'https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80',
      priceINR: '₹900–3800',
      priceUSD: '$11–46',
      priceRange: '₹900–3800',
      contactCount: 15000,
      category: 'health',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'Influencers',
      description: 'Instagram, YouTube, and LinkedIn influencers database.',
      image: 'https://images.unsplash.com/photo-1603415526960-f7e0328ec84a?q=80',
      priceINR: '₹1200–4500',
      priceUSD: '$14–54',
      priceRange: '₹1200–4500',
      contactCount: 11000,
      category: 'influencers',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  const batch = firestore.batch();
  for (const d of docs) {
    const ref = col.doc();
    batch.set(ref, d);
  }
  await batch.commit();
  console.log(`Seeded ${docs.length} documents into 'databaseMarketingCategories'.`);
  // Verify by reading back count
  const snap = await col.get();
  console.log(`[seed] Read-back count from project ${projectId || 'unknown'}:`, snap.size);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });


