// Usage: node scripts/fixMarketingPrices.js
// Ensures databaseMarketingCategories docs have clean priceUSD/priceINR strings in
// the unified format basis: "$20" and "1700" → "$20" and "₹1,700" (no deletion)

const admin = require('firebase-admin');

function ensureInit() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

function normUsd(v) {
  if (v == null) return undefined;
  const s = String(v).trim().replace(/\$/g, '').replace(/,/g, '');
  if (s.includes('-')) {
    const [a, b] = s.split('-').map((p) => p.trim());
    return `$${a}-$${b}`;
  }
  return `$${s}`;
}

function normInr(v) {
  if (v == null) return undefined;
  const s = String(v).trim().replace(/₹/g, '').replace(/,/g, '');
  if (s.includes('-')) {
    const [a, b] = s.split('-').map((p) => p.trim());
    const aN = Number(a);
    const bN = Number(b);
    const aF = Number.isFinite(aN) ? aN.toLocaleString('en-IN') : a;
    const bF = Number.isFinite(bN) ? bN.toLocaleString('en-IN') : b;
    return `₹${aF}-₹${bF}`;
  }
  const n = Number(s);
  const f = Number.isFinite(n) ? n.toLocaleString('en-IN') : s;
  return `₹${f}`;
}

async function main() {
  ensureInit();
  const db = admin.firestore();
  const col = db.collection('databaseMarketingCategories');
  const snap = await col.get();
  console.log('[fix] docs:', snap.size);

  const batch = db.batch();
  let count = 0;
  snap.forEach((d) => {
    const v = d.data() || {};
    const upd = {};
    const usd = v.priceUSD != null ? normUsd(v.priceUSD) : undefined;
    const inr = v.priceINR != null ? normInr(v.priceINR) : undefined;
    if (usd && usd !== v.priceUSD) upd.priceUSD = usd;
    if (inr && inr !== v.priceINR) upd.priceINR = inr;
    if (Object.keys(upd).length > 0) {
      batch.update(d.ref, upd);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log('[fix] updated docs:', count);
  } else {
    console.log('[fix] no changes needed');
  }
}

main().catch((e) => {
  console.error('Failed to fix prices:', e);
  process.exit(1);
});


