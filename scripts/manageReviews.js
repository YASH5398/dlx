#!/usr/bin/env node
// Usage example:
// node scripts/manageReviews.js --update all \
// --reviewsRange 4-18 --tone mixed --positiveRange 70-95 --negativeRange 5-30 \
// --variation true --randomLength true --language en --autoWrite firestore

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
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

function generateReview({ positive = true, lang = 'en', randomLength = true }) {
  const positives = [
    'Outstanding quality and fast delivery!',
    'Great value for money. Will order again.',
    'Exactly what I needed. Smooth experience.',
    'Professional and reliable service—highly recommended.',
    'Clear communication and solid results.',
    'Exceeded my expectations in every way.',
    'Top-notch support and a polished outcome.',
    'Impressive speed and attention to detail.',
    'Very satisfied with the final deliverable.'
  ];
  const mildNegatives = [
    'Good overall, but delivery took a bit longer.',
    'Quality is decent; some minor improvements needed.',
    'Service worked fine, documentation could be clearer.',
    'Result was acceptable, but communication was slow at times.',
    'Useful, though a few small issues needed tweaks.'
  ];

  let base = positive ? pick(positives) : pick(mildNegatives);
  if (randomLength) {
    const extra = [
      ' The process felt straightforward from start to finish.',
      ' Support responded quickly and resolved questions promptly.',
      ' The final output was clean and easy to use.',
      ' I appreciate the attention to detail and consistency.',
      ' Overall, a smooth and efficient experience.'
    ];
    // 50% chance to append one extra sentence
    if (Math.random() < 0.5) base += pick(extra);
  }
  // Rating: positive 4–5, negative 3–4 (mild)
  const rating = positive ? randInt(4, 5) : randInt(3, 4);
  return { text: base, rating, sentiment: positive ? 'positive' : 'mild_negative' };
}

async function upsertReviewsForService(db, serviceId, opts) {
  const { minReviews, maxReviews, posMin, posMax } = opts;
  const count = randInt(minReviews, maxReviews);
  const positiveShare = randInt(posMin, posMax); // in percent
  const positiveCount = Math.round((positiveShare / 100) * count);
  const negativeCount = Math.max(0, count - positiveCount);

  const batch = db.batch();
  const reviewsCol = db.collection('services').doc(serviceId).collection('reviews');

  for (let i = 0; i < positiveCount; i++) {
    const r = generateReview({ positive: true, lang: opts.language, randomLength: opts.randomLength });
    const ref = reviewsCol.doc();
    batch.set(ref, { ...r, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  for (let i = 0; i < negativeCount; i++) {
    const r = generateReview({ positive: false, lang: opts.language, randomLength: opts.randomLength });
    const ref = reviewsCol.doc();
    batch.set(ref, { ...r, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }

  await batch.commit();
}

async function main() {
  const args = parseArgs(process.argv);
  if (args['autoWrite'] !== 'firestore') {
    console.error('Refusing to run without --autoWrite firestore');
    process.exit(1);
  }

  ensureInit();
  const db = admin.firestore();

  const [minR, maxR] = String(args['reviewsRange'] || '4-18').split('-').map((n) => parseInt(n, 10));
  const [posMin, posMax] = String(args['positiveRange'] || '70-95').split('-').map((n) => parseInt(n, 10));
  const randomLength = String(args['randomLength'] || 'true') === 'true';
  const language = String(args['language'] || 'en');

  // Fetch all services
  const servicesSnap = await db.collection('services').get();
  console.log('[reviews] services found:', servicesSnap.size);
  let processed = 0;

  for (const doc of servicesSnap.docs) {
    const serviceId = doc.id;
    await upsertReviewsForService(db, serviceId, {
      minReviews: Math.max(1, minR || 4),
      maxReviews: Math.max(minR || 4, maxR || 18),
      posMin: Math.min(95, Math.max(0, posMin || 70)),
      posMax: Math.min(100, Math.max(posMin || 70, posMax || 95)),
      randomLength,
      language,
    });
    processed++;
    if (processed % 5 === 0) console.log('[reviews] processed:', processed);
  }

  console.log('[reviews] Completed. Services updated:', processed);
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});


