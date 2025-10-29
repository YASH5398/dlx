import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { firestore as db } from '../firebaseAdmin.js';

const FRONTEND_FILE = path.resolve(process.cwd(), 'src/pages/DatabaseCategories.tsx');
const USD_PER_INR = 1 / 83; // approx conversion

function parseCategoriesFromFrontend(source) {
  // Find the categories array region first to limit false positives
  const anchor = source.indexOf('const categories');
  if (anchor === -1) return [];
  const sub = source.slice(anchor);
  const endIdx = sub.indexOf('];');
  const body = endIdx !== -1 ? sub.slice(0, endIdx + 2) : sub;

  // Match each object having id, name, description
  const objRegex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'[\s\S]*?icon:\s*'([^']+)'[\s\S]*?contactCount:\s*(\d+)[\s\S]*?priceRange:\s*'([^']+)'[\s\S]*?\}/g;
  const results = [];
  let m;
  while ((m = objRegex.exec(body))) {
    const [ , id, name, description, icon, contactCountStr, priceRangeInr ] = m;
    results.push({ id, name, description, icon, contactCount: parseInt(contactCountStr, 10), priceRangeInr });
  }
  return results;
}

function computeUsdRange(inrRange) {
  if (!inrRange) return '';
  const nums = (inrRange.match(/\d[\d,]*/g) || []).map(n => parseInt(n.replace(/,/g, ''), 10));
  if (nums.length === 0) return '';
  const min = nums[0];
  const max = nums[1] ?? nums[0];
  const toUsd = (v) => Math.round((v * USD_PER_INR) * 100) / 100;
  return `$${toUsd(min)}–$${toUsd(max)}`;
}

function pickImageFor(name) {
  const key = (name || 'business').toLowerCase();
  // Simple keyword routing to Unsplash
  if (key.includes('real')) return 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80';
  if (key.includes('e-commerce') || key.includes('ecommerce')) return 'https://images.unsplash.com/photo-1556742400-b5cc6a1e53d2?q=80';
  if (key.includes('crypto') || key.includes('technology') || key.includes('it')) return 'https://images.unsplash.com/photo-1621811984309-97dfec0e7f9e?q=80';
  if (key.includes('startup')) return 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80';
  if (key.includes('health') || key.includes('doctor')) return 'https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80';
  if (key.includes('influencer') || key.includes('social')) return 'https://images.unsplash.com/photo-1603415526960-f7e0328ec84a?q=80';
  if (key.includes('education')) return 'https://images.unsplash.com/photo-1584697964403-4253e7c3c9d3?q=80';
  if (key.includes('finance')) return 'https://images.unsplash.com/photo-1550565118-3a14e8d038c8?q=80';
  if (key.includes('restaurant') || key.includes('food')) return 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80';
  if (key.includes('travel') || key.includes('hotel')) return 'https://images.unsplash.com/photo-1502920917128-1aa500764ce7?q=80';
  if (key.includes('automotive') || key.includes('auto')) return 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80';
  if (key.includes('fashion')) return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80';
  if (key.includes('beauty')) return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80';
  if (key.includes('fitness') || key.includes('gym')) return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80';
  if (key.includes('legal')) return 'https://images.unsplash.com/photo-1555374018-13a8994ab246?q=80';
  if (key.includes('event')) return 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80';
  if (key.includes('marketing')) return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80';
  if (key.includes('ngo') || key.includes('social')) return 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80';
  if (key.includes('logistics') || key.includes('transport')) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80';
  if (key.includes('manufacturing') || key.includes('factory')) return 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80';
  if (key.includes('agriculture') || key.includes('farm')) return 'https://images.unsplash.com/photo-1500937386664-56f3d81d41eb?q=80';
  if (key.includes('retail')) return 'https://images.unsplash.com/photo-1561715276-a2d087060f1b?q=80';
  if (key.includes('digital services') || key.includes('digital')) return 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80';
  if (key.includes('entertainment') || key.includes('media')) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80';
  if (key.includes('photography') || key.includes('videography')) return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80';
  if (key.includes('tutor') || key.includes('coaching')) return 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80';
  if (key.includes('home services') || key.includes('plumber') || key.includes('electrician')) return 'https://images.unsplash.com/photo-1581093588401-16ec7c5a3ab0?q=80';
  if (key.includes('pet')) return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80';
  if (key.includes('sports')) return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80';
  if (key.includes('freelancer') || key.includes('consultant')) return 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80';
  return 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80';
}

async function run() {
  const raw = fs.readFileSync(FRONTEND_FILE, 'utf-8');
  const items = parseCategoriesFromFrontend(raw);
  if (!items.length) {
    console.error('No categories parsed from frontend file');
    process.exit(1);
  }
  const col = db.collection('databaseMarketingCategories');
  const batch = db.batch();

  for (const it of items) {
    const priceINR = it.priceRangeInr || '';
    const priceUSD = computeUsdRange(priceINR).replace(/^\$\$/, '$');
    const doc = {
      name: it.name,
      description: it.description,
      image: pickImageFor(it.name),
      icon: it.icon,
      priceINR,
      priceUSD,
      priceRange: priceINR,
      contactCount: it.contactCount ?? 0,
      category: it.id || it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(col.doc(), doc);
  }

  await batch.commit();
  console.log(`Seeded ${items.length} documents into 'databaseMarketingCategories' from frontend categories.`);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


