import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc, serverTimestamp, query, getDocs, where } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQmsuYlFQExy2q0sZDbM7yPJHRzMZgKak",
  authDomain: "digilinex-a80a9.firebaseapp.com",
  databaseURL: "https://digilinex-a80a9-default-rtdb.firebaseio.com",
  projectId: "digilinex-a80a9",
  storageBucket: "digilinex-a80a9.firebasestorage.app",
  messagingSenderId: "197674020609",
  appId: "1:197674020609:web:e9ef458ab7186edf7bf500",
  measurementId: "G-ZT73D96ZYE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Remaining 5 products (indices 60–64 from original array)
const sampleProducts = [
  {
    title: "3000+ Mega Car Reels Bundle",
    description: "Automotive reels compilation for niche channels.",
    price: 5,
    image: "https://images.unsplash.com/photo-1502877338535-766e3a6052db?w=400&h=300&fit=crop",
    productLink: "https://drive.google.com/drive/folders/1xyepyNXc_j_ThL0A_vzfqTek5g4BRKJm?usp=sharing"
  },
  {
    title: "All-In-One Youtuber Kit / YouTube Growth Bundle",
    description: "Creator toolkit and growth systems for YouTube channels.",
    price: 6,
    image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop",
    productLink: "https://drive.google.com/drive/folders/1o-pJ996LNiVwD4kxbmHDVhUY9HHfu73w"
  },
  {
    title: "PLR/Ebook Resell Rights Database",
    description: "Access PLR database for resell rights ebooks.",
    price: 6,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop",
    productLink: "https://www.plrdatabase.net/?ref=303"
  },
  {
    title: "LinkedIn Message Script",
    description: "Prewritten scripts for LinkedIn outreach.",
    price: 4,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop",
    productLink: "https://drive.google.com/file/d/1fnzbvRocKK7oXBpDjYTHFPgC02gikTTN/view"
  },
  {
    title: "Instagram Direct Message Templates",
    description: "DM templates to engage and convert followers.",
    price: 4,
    image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop",
    productLink: "https://drive.google.com/file/d/1Vcyg_YMJcU3ZuleSUbnGimweBK4oOQve/view"
  }
];

// Function to validate a product
function validateProduct(product) {
  return (
    product.title &&
    typeof product.title === "string" &&
    product.description &&
    typeof product.description === "string" &&
    typeof product.price === "number" &&
    product.image &&
    typeof product.image === "string" &&
    product.productLink &&
    typeof product.productLink === "string"
  );
}

// Function to check for duplicates in Firestore
async function checkForDuplicate(title) {
  const productsRef = collection(db, "digitalProducts");
  const q = query(productsRef, where("title", "==", title));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Function to add products in a single batch with verification
async function addProductsToFirestore() {
  const productsRef = collection(db, "digitalProducts");
  const batchSize = 30; // Set to 30 for consistency, though only 5 products here
  const totalProducts = sampleProducts.length;
  const maxRetries = 3;
  let processedCount = 0;

  console.log(`Starting to add ${totalProducts} products to Firestore in a batch...`);

  // Validate and filter out duplicates or invalid products
  const seenTitles = new Set();
  const validProducts = [];
  for (const product of sampleProducts) {
    if (!validateProduct(product)) {
      console.warn(`Skipping invalid product: ${JSON.stringify(product)}`);
      continue;
    }
    if (seenTitles.has(product.title)) {
      console.warn(`Skipping duplicate product title in input: "${product.title}"`);
      continue;
    }
    const isDuplicate = await checkForDuplicate(product.title);
    if (isDuplicate) {
      console.warn(`Skipping product already in Firestore: "${product.title}"`);
      continue;
    }
    seenTitles.add(product.title);
    validProducts.push(product);
  }

  console.log(`Validated ${validProducts.length} unique products to add.`);

  if (validProducts.length === 0) {
    console.log("No valid products to add. Exiting.");
    return;
  }

  // Process products in a single batch (since <= 30 products)
  const batchProducts = validProducts.slice(0, batchSize);
  const batchStart = 1;
  const batchEnd = validProducts.length;
  let batchSuccess = false;
  let attempt = 0;

  console.log(`Processing batch 1 (${batchStart} to ${batchEnd})...`);

  // Attempt to commit the batch with retries
  while (attempt < maxRetries && !batchSuccess) {
    attempt++;
    const batch = writeBatch(db);
    const batchDocRefs = [];

    // Add products to the batch
    batchProducts.forEach((product) => {
      const docRef = doc(productsRef);
      batch.set(docRef, {
        title: product.title,
        description: product.description,
        price: product.price,
        image: product.image,
        productLink: product.productLink,
        status: "approved",
        createdAt: serverTimestamp()
      });
      batchDocRefs.push({ ref: docRef, title: product.title });
    });

    try {
      await batch.commit();
      console.log(`Batch 1 committed successfully. Verifying...`);

      // Verify each document in the batch
      let verificationFailed = false;
      for (const { ref, title } of batchDocRefs) {
        const docSnap = await getDocs(query(productsRef, where("title", "==", title)));
        if (docSnap.empty) {
          console.error(`[${batchDocRefs.indexOf({ ref, title }) + 1}/${validProducts.length}] Verification failed: "${title}" not found in Firestore.`);
          verificationFailed = true;
        } else {
          const docData = docSnap.docs[0].data();
          const expectedData = batchProducts.find(p => p.title === title);
          if (
            docData.title !== title ||
            docData.description !== expectedData.description ||
            docData.price !== expectedData.price ||
            docData.image !== expectedData.image ||
            docData.productLink !== expectedData.productLink ||
            docData.status !== "approved"
          ) {
            console.error(`[${batchDocRefs.indexOf({ ref, title }) + 1}/${validProducts.length}] Verification failed: Data mismatch for "${title}".`);
            verificationFailed = true;
          } else {
            console.log(`[${batchDocRefs.indexOf({ ref, title }) + 1}/${validProducts.length}] Added and verified product: "${title}"`);
          }
        }
      }

      if (!verificationFailed) {
        batchSuccess = true;
        processedCount += batchProducts.length;
      } else if (attempt < maxRetries) {
        console.log(`Retrying batch 1 in 2 seconds due to verification failure...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error(`Batch 1 failed verification after ${maxRetries} attempts. Skipping batch.`);
      }
    } catch (error) {
      console.error(`[${batchStart}/${validProducts.length}] Batch 1 failed on attempt ${attempt}: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`Retrying batch 1 in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error(`[${batchStart}/${validProducts.length}] Batch 1 failed after ${maxRetries} attempts. Skipping batch.`);
      }
    }
  }

  console.log(`✅ Processed ${processedCount} out of ${validProducts.length} products successfully!`);
  if (processedCount < validProducts.length) {
    console.warn(`⚠️ ${validProducts.length - processedCount} products failed to add or verify. Check logs for details.`);
  }
}

// Execute the function
addProductsToFirestore().catch((error) => {
  console.error("❌ Script execution failed:", error.message);
});