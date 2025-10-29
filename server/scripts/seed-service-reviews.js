import admin from 'firebase-admin';
import { firestore as adminFs } from '../firebaseAdmin.js';

const names = [
  'Aarav Sharma','Vivaan Mehta','Aditya Verma','Vihaan Kapoor','Ishaan Nair',
  'Kabir Joshi','Arjun Malhotra','Reyansh Gupta','Shaurya Chatterjee','Atharv Pillai',
  'Ananya Singh','Aadhya Desai','Diya Reddy','Myra Iyer','Aarohi Bhatia',
  'Anika Menon','Ira Kulkarni','Sara Dutta','Kiara Basu','Navya Khanna',
  'Rohan Patel','Kunal Deshmukh','Siddharth Rao','Pranav Sinha','Harsh Vora',
  'Meera Rao','Ritika Jain','Pooja Bhargava','Nisha Chauhan','Sneha Saluja'
];

const feedbacks = [
  'Amazing service! Totally satisfied.',
  'The team delivered everything on time!',
  'Very professional and reliable company.',
  'Fantastic quality work. Highly recommended!',
  'Excellent service and timely support!',
  'Very professional team, great experience!',
  'Highly satisfied with the results!',
  'Outstanding quality and quick delivery.',
  'Great communication and smooth execution.',
  'Professional, reliable and on-time delivery.',
  'High-quality work and responsive support.',
  'Impressive attention to detail and execution.',
  'Helped accelerate our project growth.',
  'Value for money, strongly recommended.',
  'Project delivered as promised, excellent!'
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log('Seeding dummy reviews for all services (ignore existing counts, add 5–30 fresh per service)...');

  const servicesSnap = await adminFs.collection('services').get();
  if (servicesSnap.empty) {
    console.log('No services found. Aborting.');
    return;
  }

  let totalAdded = 0;

  for (const svcDoc of servicesSnap.docs) {
    const serviceId = svcDoc.id;
    const data = svcDoc.data() || {};
    const title = data.title || data.name || serviceId;

    const reviewsCol = adminFs.collection('services').doc(serviceId).collection('reviews');
    // Always add a new random number of reviews between 5–30
    const toAdd = randInt(5, 30);

    if (toAdd === 0) {
      console.log(`Skip: ${title} (${serviceId}) already meets minimum with ${existingCount}`);
      continue;
    }

    const batch = adminFs.batch();
    for (let i = 0; i < toAdd; i++) {
      const reviewRef = reviewsCol.doc();
      const rating = randInt(3, 5);
      const name = names[randInt(0, names.length - 1)];
      // Randomly include service title for relevance
      const base = feedbacks[randInt(0, feedbacks.length - 1)];
      const includeTitle = Math.random() < 0.35;
      const review = includeTitle ? `${base} (${title})` : base;
      batch.set(reviewRef, {
        userId: 'dummyUser',
        userName: name,
        userEmail: 'dummy@example.com',
        rating,
        review,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isDummy: true,
      });
    }
    await batch.commit();
    totalAdded += toAdd;

    // Fetch new total count for accurate logging
    const newCountSnap = await reviewsCol.get();
    console.log(`Seeded ${toAdd} new reviews for service: ${title} (${serviceId}). New total: ${newCountSnap.size}`);
  }

  console.log(`Done. Total dummy reviews added this run: ${totalAdded}`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
