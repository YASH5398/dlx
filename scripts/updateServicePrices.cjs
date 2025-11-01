#!/usr/bin/env node
// Update selected services' price and set discountLabel = "40% OFF" without touching others.
// Usage: node scripts/updateServicePrices.cjs

const admin = require('firebase-admin');

function ensureInit() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

// Map of service document IDs (slugs) to plain price strings
const PRICE_UPDATES = new Map([
  ['affiliate-referral-app-system', '400$'],
  ['e-commerce-mobile-app', '450$'],
  ['android-app-linked-with-website', '350$'],
  ['ai-chat-app-chatgpt-style', '350$'],
  ['lead-capture-chatbot', '180$'],
  ['affiliate-program-creation-system', '400$'],
  ['business-website-setup', '200$'],
  ['website-development', '200$'],
  ['crypto-audit', '700$'],
  ['crypto-token-creation', '200$'],
]);

async function main() {
  ensureInit();
  const db = admin.firestore();

  let updated = 0;
  for (const [id, price] of PRICE_UPDATES.entries()) {
    const ref = db.collection('services').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.warn(`[update] service not found: ${id}`);
      continue;
    }
    await ref.update({ price, discountLabel: '40% OFF' });
    updated++;
    console.log(`[update] ${id} -> price=${price}, discountLabel=40% OFF`);
  }
  console.log(`[update] completed. updated=${updated}`);
}

main().catch((e) => {
  console.error('Failed to update prices:', e);
  process.exit(1);
});


