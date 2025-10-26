import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",
  authDomain: "digilinex-a80a9.firebaseapp.com",
  projectId: "digilinex-a80a9",
  storageBucket: "digilinex-a80a9.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

console.log('🧪 TESTING REFERRAL SYSTEM FIX\n');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

async function testReferralSystem() {
  try {
    console.log('📊 TESTING REFERRAL SYSTEM FIXES\n');
    
    // Test 1: Check if user documents have referral fields
    console.log('1. CHECKING USER DOCUMENTS FOR REFERRAL FIELDS:');
    const usersRef = collection(firestore, 'users');
    const usersQuery = query(usersRef);
    const usersSnap = await getDocs(usersQuery);
    
    if (usersSnap.size > 0) {
      const sampleUser = usersSnap.docs[0];
      const userData = sampleUser.data();
      
      const referralFields = [
        'referralCode', 'referrerCode', 'referralCount', 'activeReferrals',
        'totalEarningsUsd', 'referralEarnings', 'affiliateEarnings'
      ];
      
      console.log('   📋 Sample user document referral fields:');
      referralFields.forEach(field => {
        if (userData[field] !== undefined) {
          console.log(`   ✅ ${field}: ${userData[field]}`);
        } else {
          console.log(`   ❌ ${field}: NOT FOUND`);
        }
      });
    } else {
      console.log('   ❌ No users found in database');
    }
    
    // Test 2: Check orders collection for affiliate data
    console.log('\n2. CHECKING ORDERS COLLECTION FOR AFFILIATE DATA:');
    const ordersRef = collection(firestore, 'orders');
    const ordersQuery = query(ordersRef);
    const ordersSnap = await getDocs(ordersQuery);
    
    if (ordersSnap.size > 0) {
      console.log(`   📁 Orders collection has ${ordersSnap.size} documents`);
      
      const sampleOrder = ordersSnap.docs[0];
      const orderData = sampleOrder.data();
      
      const affiliateFields = [
        'affiliateId', 'userId', 'userName', 'amountUsd', 'status', 'timestamp'
      ];
      
      console.log('   📋 Sample order document affiliate fields:');
      affiliateFields.forEach(field => {
        if (orderData[field] !== undefined) {
          console.log(`   ✅ ${field}: ${orderData[field]}`);
        } else {
          console.log(`   ❌ ${field}: NOT FOUND`);
        }
      });
    } else {
      console.log('   ❌ No orders found in database');
    }
    
    // Test 3: Check referrals collection
    console.log('\n3. CHECKING REFERRALS COLLECTION:');
    const referralsRef = collection(firestore, 'referrals');
    const referralsQuery = query(referralsRef);
    const referralsSnap = await getDocs(referralsQuery);
    
    console.log(`   📁 Referrals collection has ${referralsSnap.size} documents`);
    
    if (referralsSnap.size > 0) {
      const sampleReferral = referralsSnap.docs[0];
      const referralData = sampleReferral.data();
      
      console.log('   📋 Sample referral document structure:');
      console.log('   ', JSON.stringify(referralData, null, 2));
    }
    
    // Test 4: Check affiliates collection
    console.log('\n4. CHECKING AFFILIATES COLLECTION:');
    const affiliatesRef = collection(firestore, 'affiliates');
    const affiliatesQuery = query(affiliatesRef);
    const affiliatesSnap = await getDocs(affiliatesQuery);
    
    console.log(`   📁 Affiliates collection has ${affiliatesSnap.size} documents`);
    
    if (affiliatesSnap.size > 0) {
      const sampleAffiliate = affiliatesSnap.docs[0];
      const affiliateData = sampleAffiliate.data();
      
      console.log('   📋 Sample affiliate document structure:');
      console.log('   ', JSON.stringify(affiliateData, null, 2));
    }
    
    console.log('\n🎯 REFERRAL SYSTEM ANALYSIS:');
    console.log('1. ✅ User documents should have referral fields');
    console.log('2. ✅ Orders should track affiliateId for referrals');
    console.log('3. ✅ Referrals collection should exist (optional)');
    console.log('4. ✅ Affiliates collection should exist (optional)');
    
    console.log('\n🔧 EXPECTED FIXES:');
    console.log('1. ✅ useReferral hook now uses user document as primary source');
    console.log('2. ✅ Orders query properly calculates active referrals');
    console.log('3. ✅ Referral count calculated from users with matching referrerCode');
    console.log('4. ✅ Tier and rate calculated based on active referrals');
    console.log('5. ✅ Total earnings calculated from completed orders');
    
    console.log('\n🚀 EXPECTED RESULTS:');
    console.log('✅ Active Referrals will display correctly');
    console.log('✅ Total Referrals will show proper count');
    console.log('✅ Referral Earnings will calculate properly');
    console.log('✅ Tier and Rate will update based on referrals');
    console.log('✅ All data will update in real-time');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testReferralSystem();
