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

function generateReview({ positive = true, randomLength = true, minWords = 8, maxWords = 20, tone = 'natural' }) {
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
  const naturalBits = [
    'Super helpful team', 'process felt smooth', 'delivered on time', 'clear step-by-step updates', 'quality was better than expected',
    'minor tweaks addressed quickly', 'friendly communication', 'easy to work with', 'results felt professional', 'overall solid value',
    'kept promises', 'attention to detail shows', 'no hassle from start to finish', 'recommend to others', 'met our use case well'
  ];
  const targetLen = randInt(Math.max(3, minWords), Math.max(minWords, maxWords));
  let words = [];
  // seed with a base sentiment
  const seed = (positive ? pick(positives) : pick(mildNegatives)).replace(/[.!]/g, '');
  words.push(...seed.split(/\s+/));
  while (words.length < targetLen) {
    words.push(pick(naturalBits));
  }
  if (!randomLength) {
    while (words.length > targetLen) words.pop();
  }
  // tidy sentence
  let base = words.join(' ').replace(/\s+/g, ' ').trim();
  base = base.charAt(0).toUpperCase() + base.slice(1);
  if (!/[.!?]$/.test(base)) base += '.';
  const rating = positive ? randInt(4, 5) : randInt(3, 4);
  return { text: base, rating, sentiment: positive ? 'positive' : 'mild_negative' };
}

async function upsertReviewsForService(db, serviceId, opts) {
  const count = randInt(opts.minReviews, opts.maxReviews);
  const positiveShare = randInt(opts.posMin, opts.posMax);
  const positiveCount = Math.round((positiveShare / 100) * count);
  const negativeCount = Math.max(0, count - positiveCount);
  const batch = db.batch();
  const col = db.collection('services').doc(serviceId).collection('reviews');
  const seen = new Set();
  for (let i = 0; i < positiveCount; i++) {
    let r = generateReview({ positive: true, randomLength: opts.randomLength, minWords: opts.minWords, maxWords: opts.maxWords, tone: opts.tone });
    // ensure uniqueness per service run
    let guard = 0;
    while (opts.unique && seen.has(r.text) && guard++ < 5) {
      r = generateReview({ positive: true, randomLength: opts.randomLength, minWords: opts.minWords, maxWords: opts.maxWords, tone: opts.tone });
    }
    seen.add(r.text);
    batch.set(col.doc(), { ...r, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  for (let i = 0; i < negativeCount; i++) {
    let r = generateReview({ positive: false, randomLength: opts.randomLength, minWords: opts.minWords, maxWords: opts.maxWords, tone: opts.tone });
    let guard = 0;
    while (opts.unique && seen.has(r.text) && guard++ < 5) {
      r = generateReview({ positive: false, randomLength: opts.randomLength, minWords: opts.minWords, maxWords: opts.maxWords, tone: opts.tone });
    }
    seen.add(r.text);
    batch.set(col.doc(), { ...r, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await batch.commit();
}

async function main() {
  const args = parseArgs(process.argv);
  if (args['autoWrite'] !== 'firestore') { console.error('Use --autoWrite firestore'); process.exit(1); }
  ensureInit();
  const db = admin.firestore();
  const [minR, maxR] = String(args['reviewsRange'] || '4-18').split('-').map((n) => parseInt(n, 10));
  const [posMin, posMax] = String(args['positiveRange'] || '70-95').split('-').map((n) => parseInt(n, 10));
  const randomLength = String(args['randomLength'] || 'true') === 'true';

  const services = await db.collection('services').get();
  console.log('[reviews] services:', services.size);
  let done = 0;
  for (const d of services.docs) {
    await upsertReviewsForService(db, d.id, {
      minReviews: Math.max(1, minR || 4),
      maxReviews: Math.max(minR || 4, maxR || 18),
      posMin: Math.min(95, Math.max(0, posMin || 70)),
      posMax: Math.min(100, Math.max(posMin || 70, posMax || 95)),
      randomLength,
      minWords: parseInt(String(args['minWords'] || '8'), 10),
      maxWords: parseInt(String(args['maxWords'] || '20'), 10),
      unique: String(args['uniqueMessages'] || 'true') === 'true',
      tone: String(args['tone'] || 'natural'),
    });
    done++;
    if (done % 5 === 0) console.log('[reviews] processed:', done);
  }
  console.log('[reviews] completed:', done);
}

main().catch((e) => { console.error(e); process.exit(1); });


