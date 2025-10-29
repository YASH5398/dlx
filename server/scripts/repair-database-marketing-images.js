// Repair script for databaseMarketingCategories collection
// Validates and fixes image URLs for all documents
import admin from 'firebase-admin';
import { firestore } from '../firebaseAdmin.js';

// Mapping of category names to relevant stock images (Unsplash)
const CATEGORY_IMAGE_MAP = {
  'Real Estate': 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=800&auto=format&fit=crop',
  'E-commerce': 'https://images.unsplash.com/photo-1556742400-b5cc6a1e53d2?q=80&w=800&auto=format&fit=crop',
  'Crypto Investors': 'https://images.unsplash.com/photo-1621811984309-97dfec0e7f9e?q=80&w=800&auto=format&fit=crop',
  'Startups': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
  'Health Professionals': 'https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80&w=800&auto=format&fit=crop',
  'Influencers': 'https://images.unsplash.com/photo-1603415526960-f7e0328ec84a?q=80&w=800&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop'
};

// Additional category-specific images for common categories
const CATEGORY_SLUG_IMAGE_MAP = {
  'real-estate': 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=800&auto=format&fit=crop',
  'ecommerce': 'https://images.unsplash.com/photo-1556742400-b5cc6a1e53d2?q=80&w=800&auto=format&fit=crop',
  'crypto-investors': 'https://images.unsplash.com/photo-1621811984309-97dfec0e7f9e?q=80&w=800&auto=format&fit=crop',
  'startups': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
  'health': 'https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80&w=800&auto=format&fit=crop',
  'influencers': 'https://images.unsplash.com/photo-1603415526960-f7e0328ec84a?q=80&w=800&auto=format&fit=crop',
  'technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
  'finance': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
  'education': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800&auto=format&fit=crop',
  'business': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
};

/**
 * Quick client-side validation (protocol + domain)
 */
function isWellFormedImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  
  // Must be HTTPS
  if (!url.startsWith('https://')) return false;
  
  // Must be a valid URL format
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
  } catch (e) {
    return false;
  }
  
  // Check for common image hosting domains or storage URLs
  const validDomains = [
    'unsplash.com',
    'pexels.com',
    'images.unsplash.com',
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'cloudinary.com',
    'imgur.com',
    'i.imgur.com',
  ];
  
  const urlLower = url.toLowerCase();
  const hasValidDomain = validDomains.some(domain => urlLower.includes(domain));
  
  return hasValidDomain;
}

/**
 * Network validation with HEAD request to confirm accessibility and content-type
 */
async function isAccessibleImage(url) {
  if (!isWellFormedImageUrl(url)) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('image')) return false;
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Gets a replacement image URL based on category name or slug
 */
function getReplacementImage(categoryName, categorySlug) {
  // Try category name first
  if (categoryName && CATEGORY_IMAGE_MAP[categoryName]) {
    return CATEGORY_IMAGE_MAP[categoryName];
  }
  
  // Try category slug
  if (categorySlug && CATEGORY_SLUG_IMAGE_MAP[categorySlug]) {
    return CATEGORY_SLUG_IMAGE_MAP[categorySlug];
  }
  
  // Return default
  return CATEGORY_IMAGE_MAP.default;
}

async function repairImages() {
  const opts = admin.app().options || {};
  const projectId = opts.projectId || process.env.FIREBASE_PROJECT_ID;
  console.log(`[repair] Using projectId: ${projectId || 'unknown'}`);
  
  const col = firestore.collection('databaseMarketingCategories');
  
  try {
    // Fetch all documents
    const snapshot = await col.get();
    console.log(`[repair] Found ${snapshot.size} documents in collection`);
    
    if (snapshot.empty) {
      console.log('[repair] No documents found. Nothing to repair.');
      return;
    }
    
    const batch = firestore.batch();
    let updateCount = 0;
    let skipCount = 0;
    
    // Validate documents sequentially to avoid throttling
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentImage = data.image;
      const categoryName = data.name || '';
      const categorySlug = data.category || '';
      
      const currentIsOk = await isAccessibleImage(currentImage);
      if (currentIsOk) {
        console.log(`[repair] Document "${doc.id}" (${categoryName}): ✓ Valid image`);
        skipCount++;
        continue;
      }

      // Try mapped replacement
      let replacementImage = getReplacementImage(categoryName, categorySlug);
      const replacementOk = await isAccessibleImage(replacementImage);

      // Fallback to default if mapped fails
      if (!replacementOk) {
        replacementImage = getReplacementImage('', '');
      }

      console.log(`[repair] Document "${doc.id}" (${categoryName}):`);
      console.log(`  ❌ Invalid image: ${currentImage || '(missing)'}`);
      console.log(`  ✅ Replacing with: ${replacementImage}`);

      batch.update(doc.ref, { image: replacementImage });
      updateCount++;
    }
    
    // Commit all updates
    if (updateCount > 0) {
      console.log(`\n[repair] Committing ${updateCount} updates...`);
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} documents`);
    } else {
      console.log(`\n✅ All images are valid. No updates needed.`);
    }
    
    console.log(`\n[repair] Summary:`);
    console.log(`  Total documents: ${snapshot.size}`);
    console.log(`  Updated: ${updateCount}`);
    console.log(`  Skipped (already valid): ${skipCount}`);
    
    // Verify by reading back
    const verifySnapshot = await col.get();
    let validCount = 0;
    for (const vdoc of verifySnapshot.docs) {
      const data = vdoc.data();
      if (await isAccessibleImage(data.image)) {
        validCount++;
      }
    }
    
    console.log(`\n[repair] Verification:`);
    console.log(`  Documents with valid images: ${validCount}/${verifySnapshot.size}`);
    
    if (validCount === verifySnapshot.size) {
      console.log(`  ✅ All images are now valid!`);
    } else {
      console.log(`  ⚠️  ${verifySnapshot.size - validCount} documents still have invalid images`);
    }
    
  } catch (error) {
    console.error('[repair] Error:', error);
    throw error;
  }
}

repairImages()
  .then(() => {
    console.log('\n[repair] Repair script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[repair] Repair script failed:', err);
    process.exit(1);
  });

