#!/usr/bin/env node
const admin = require('firebase-admin');

function ensureInit() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true; else { args[key] = next; i++; }
    }
  }
  return args;
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

// Generate realistic user names
function generateUserName() {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Riley', 'Avery', 'Quinn', 'Cameron', 'Dakota', 'Sage', 'River', 'Phoenix', 'Blake', 'Drew', 'Hayden', 'Parker', 'Reese', 'Rowan', 'Skylar', 'Ellis', 'Emery', 'Finley', 'Harper', 'Logan', 'Noah', 'Liam', 'Emma', 'Olivia', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Evelyn', 'Abigail', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Mason', 'Michael', 'Ethan', 'Daniel'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
  return `${pick(firstNames)} ${pick(lastNames)}`;
}

function generateReview({ positive = true, wordCount = 15, serviceName = '', userName = '' }) {
  const positives = {
    8: [
      'Outstanding quality and fast delivery.',
      'Great value for money. Highly recommended.',
      'Exactly what I needed. Smooth experience.',
      'Professional service with excellent results.',
      'Exceeded expectations in every way.',
      'Top-notch support and polished outcome.',
      'Impressive speed and attention to detail.',
      'Very satisfied with the final deliverable.'
    ],
    15: [
      'Outstanding quality and fast delivery. The team was professional throughout.',
      'Great value for money and excellent communication. Will order again soon.',
      'Exactly what I needed with smooth experience from start to finish.',
      'Professional service with excellent results that met all requirements perfectly.',
      'Exceeded my expectations in every way with attention to detail.',
      'Top-notch support and polished outcome that impressed everyone involved.',
      'Impressive speed and attention to detail throughout the entire process.',
      'Very satisfied with the final deliverable and would recommend to others.'
    ],
    20: [
      'Outstanding quality and fast delivery. The team was professional and responsive throughout the entire project timeline.',
      'Great value for money with excellent communication at every step. I will definitely order again in the future.',
      'Exactly what I needed with a smooth experience from initial contact through final delivery. Highly satisfied.',
      'Professional service with excellent results that met all requirements perfectly. The work exceeded my expectations.',
      'Exceeded my expectations in every way with attention to detail and clear communication throughout the process.',
      'Top-notch support and polished outcome that impressed everyone involved. The quality was better than expected.',
      'Impressive speed and attention to detail throughout the entire process. The final result was perfect for our needs.',
      'Very satisfied with the final deliverable and would recommend to others. The team made the whole process easy.'
    ]
  };
  const mildNegatives = {
    8: [
      'Good overall, but delivery took longer than expected.',
      'Quality is decent, but some minor improvements needed.',
      'Service worked fine, but documentation could be clearer.',
      'Result was acceptable, but communication was slow at times.',
      'Useful service, though a few small issues needed tweaks.'
    ],
    15: [
      'Good overall service, but delivery took a bit longer than originally promised by the team.',
      'Quality is decent overall, but some minor improvements and adjustments were needed afterward.',
      'Service worked fine for our needs, but the documentation provided could have been much clearer.',
      'Result was acceptable and functional, but communication during the project was somewhat slow at times.',
      'Useful service that met basic requirements, though a few small issues needed tweaks after delivery.'
    ],
    20: [
      'Good overall service and the final result works, but delivery took a bit longer than originally promised by the team.',
      'Quality is decent overall and functional, but some minor improvements and adjustments were needed afterward to meet expectations.',
      'Service worked fine for our basic needs and requirements, but the documentation provided could have been much clearer and more detailed.',
      'Result was acceptable and functional for our use case, but communication during the project timeline was somewhat slow at certain times.',
      'Useful service that met our basic requirements and needs, though a few small issues needed tweaks and fixes after the initial delivery.'
    ]
  };
  
  const pool = positive ? positives[wordCount] || positives[15] : mildNegatives[wordCount] || mildNegatives[15];
  const text = pick(pool);
  const rating = positive ? (wordCount === 8 ? randInt(4, 5) : randInt(4, 5)) : randInt(3, 4);
  return { text, rating, sentiment: positive ? 'positive' : 'mild_negative', userName: userName || generateUserName() };
}

async function upsertReviewsForService(db, serviceId, serviceData, opts) {
  const count = randInt(opts.minReviews, opts.maxReviews);
  // Fixed 80% positive, 20% negative
  const positiveCount = Math.round((80 / 100) * count);
  const negativeCount = Math.max(0, count - positiveCount);
  
  // Vary word counts: 8, 15, 20
  const wordCounts = [8, 15, 20];
  
  const batch = db.batch();
  const col = db.collection('services').doc(serviceId).collection('reviews');
  const seen = new Set();
  const serviceName = serviceData?.title || serviceData?.name || 'Service';
  
  for (let i = 0; i < positiveCount; i++) {
    const wordCount = pick(wordCounts);
    const userName = generateUserName();
    let r = generateReview({ positive: true, wordCount, serviceName, userName });
    // ensure uniqueness per service run
    let guard = 0;
    while (opts.unique && seen.has(r.text) && guard++ < 10) {
      r = generateReview({ positive: true, wordCount, serviceName, userName: generateUserName() });
    }
    seen.add(r.text);
    const reviewDoc = {
      userName: r.userName,
      review: r.text,
      rating: r.rating,
      sentiment: r.sentiment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtServer: admin.firestore.FieldValue.serverTimestamp()
    };
    batch.set(col.doc(), reviewDoc);
  }
  for (let i = 0; i < negativeCount; i++) {
    const wordCount = pick(wordCounts);
    const userName = generateUserName();
    let r = generateReview({ positive: false, wordCount, serviceName, userName });
    let guard = 0;
    while (opts.unique && seen.has(r.text) && guard++ < 10) {
      r = generateReview({ positive: false, wordCount, serviceName, userName: generateUserName() });
    }
    seen.add(r.text);
    const reviewDoc = {
      userName: r.userName,
      review: r.text,
      rating: r.rating,
      sentiment: r.sentiment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtServer: admin.firestore.FieldValue.serverTimestamp()
    };
    batch.set(col.doc(), reviewDoc);
  }
  await batch.commit();
}

async function main() {
  const args = parseArgs(process.argv);
  if (args['autoWrite'] !== 'firestore') { console.error('Use --autoWrite firestore'); process.exit(1); }
  ensureInit();
  const db = admin.firestore();
  const [minR, maxR] = String(args['reviewsRange'] || '3-12').split('-').map((n) => parseInt(n, 10));

  const services = await db.collection('services').get();
  console.log('[reviews] services:', services.size);
  let done = 0;
  for (const d of services.docs) {
    const serviceData = d.data();
    // Delete existing reviews for this service
    const existingReviews = await db.collection('services').doc(d.id).collection('reviews').get();
    if (existingReviews.size > 0) {
      const deleteBatch = db.batch();
      existingReviews.forEach((reviewDoc) => {
        deleteBatch.delete(reviewDoc.ref);
      });
      await deleteBatch.commit();
      console.log(`[reviews] Deleted ${existingReviews.size} existing reviews for ${serviceData.title || d.id}`);
    }
    
    await upsertReviewsForService(db, d.id, serviceData, {
      minReviews: Math.max(3, minR || 3),
      maxReviews: Math.max(minR || 3, maxR || 12),
      unique: String(args['uniqueMessages'] !== 'false') === 'true',
    });
    done++;
    if (done % 5 === 0) console.log(`[reviews] processed: ${done}/${services.size}`);
  }
  console.log(`[reviews] completed: ${done} services processed`);
}

main().catch((e) => { console.error(e); process.exit(1); });


