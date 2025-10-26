import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",
  authDomain: "digilinex-a80a9.firebaseapp.com",
  projectId: "digilinex-a80a9",
  storageBucket: "digilinex-a80a9.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

console.log('🔍 REFERRAL DATA FLOW INVESTIGATION\n');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

async function investigateReferralData() {
  try {
    console.log('📊 INVESTIGATING REFERRAL DATA STRUCTURE\n');
    
    // Test with a sample user ID (you can replace this with an actual user ID)
    const testUserId = 'test-user-id';
    
    console.log('1. CHECKING REFERRALS COLLECTION STRUCTURE:');
    
    // Check if referrals collection exists and has documents
    const referralsRef = collection(firestore, 'referrals');
    const referralsQuery = query(referralsRef);
    
    try {
      const referralsSnap = await getDocs(referralsQuery);
      console.log(`   📁 Referrals collection has ${referralsSnap.size} documents`);
      
      if (referralsSnap.size > 0) {
        console.log('   📋 Sample referral document structure:');
        const sampleDoc = referralsSnap.docs[0];
        const sampleData = sampleDoc.data();
        console.log('   ', JSON.stringify(sampleData, null, 2));
      }
    } catch (error) {
      console.log('   ❌ Error accessing referrals collection:', error.message);
    }
    
    console.log('\n2. CHECKING USERS COLLECTION FOR REFERRAL FIELDS:');
    
    // Check users collection for referral-related fields
    const usersRef = collection(firestore, 'users');
    const usersQuery = query(usersRef);
    
    try {
      const usersSnap = await getDocs(usersQuery);
      console.log(`   📁 Users collection has ${usersSnap.size} documents`);
      
      if (usersSnap.size > 0) {
        console.log('   📋 Sample user document structure:');
        const sampleUser = usersSnap.docs[0];
        const userData = sampleUser.data();
        
        // Check for referral-related fields
        const referralFields = [
          'referralCode', 'referrerCode', 'referralCount', 'activeReferrals',
          'totalEarningsUsd', 'referralEarnings', 'affiliateEarnings'
        ];
        
        console.log('   🔍 Referral-related fields in user document:');
        referralFields.forEach(field => {
          if (userData[field] !== undefined) {
            console.log(`   ✅ ${field}: ${userData[field]}`);
          } else {
            console.log(`   ❌ ${field}: NOT FOUND`);
          }
        });
      }
    } catch (error) {
      console.log('   ❌ Error accessing users collection:', error.message);
    }
    
    console.log('\n3. CHECKING ORDERS COLLECTION FOR AFFILIATE DATA:');
    
    // Check orders collection for affiliate-related data
    const ordersRef = collection(firestore, 'orders');
    const ordersQuery = query(ordersRef);
    
    try {
      const ordersSnap = await getDocs(ordersQuery);
      console.log(`   📁 Orders collection has ${ordersSnap.size} documents`);
      
      if (ordersSnap.size > 0) {
        console.log('   📋 Sample order document structure:');
        const sampleOrder = ordersSnap.docs[0];
        const orderData = sampleOrder.data();
        
        // Check for affiliate-related fields
        const affiliateFields = [
          'affiliateId', 'userId', 'userName', 'amountUsd', 'status', 'timestamp'
        ];
        
        console.log('   🔍 Affiliate-related fields in order document:');
        affiliateFields.forEach(field => {
          if (orderData[field] !== undefined) {
            console.log(`   ✅ ${field}: ${orderData[field]}`);
          } else {
            console.log(`   ❌ ${field}: NOT FOUND`);
          }
        });
      }
    } catch (error) {
      console.log('   ❌ Error accessing orders collection:', error.message);
    }
    
    console.log('\n4. CHECKING AFFILIATES COLLECTION:');
    
    // Check affiliates collection
    const affiliatesRef = collection(firestore, 'affiliates');
    const affiliatesQuery = query(affiliatesRef);
    
    try {
      const affiliatesSnap = await getDocs(affiliatesQuery);
      console.log(`   📁 Affiliates collection has ${affiliatesSnap.size} documents`);
      
      if (affiliatesSnap.size > 0) {
        console.log('   📋 Sample affiliate document structure:');
        const sampleAffiliate = affiliatesSnap.docs[0];
        const affiliateData = sampleAffiliate.data();
        console.log('   ', JSON.stringify(affiliateData, null, 2));
      }
    } catch (error) {
      console.log('   ❌ Error accessing affiliates collection:', error.message);
    }
    
    console.log('\n🎯 IDENTIFIED ISSUES:');
    console.log('1. 🔍 Check if referrals collection has documents');
    console.log('2. 🔍 Check if users have referral-related fields');
    console.log('3. 🔍 Check if orders have affiliate data');
    console.log('4. 🔍 Check if affiliates collection has data');
    console.log('5. 🔍 Check field name consistency across collections');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. ✅ Ensure referrals collection has documents for each user');
    console.log('2. ✅ Ensure users collection has referral fields');
    console.log('3. ✅ Ensure orders collection tracks affiliate data');
    console.log('4. ✅ Ensure field names are consistent');
    console.log('5. ✅ Add proper error handling for missing data');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

// Run the investigation
investigateReferralData();
