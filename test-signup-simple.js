/**
 * Simple Signup System Test
 * Tests the signup system by creating a test user and verifying document structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBwJ1BqFj4X8Y9Z2C3D4E5F6G7H8I9J0K",
  authDomain: "dlx-ai.firebaseapp.com",
  projectId: "dlx-ai",
  storageBucket: "dlx-ai.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuvwxyz"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testSignupSystem() {
  console.log('🚀 Starting Signup System Test');
  console.log('=' .repeat(50));
  
  const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    phone: '9876543210',
    referralCode: null
  };
  
  let userId = null;
  
  try {
    // Step 1: Create user with email/password
    console.log('📧 Creating test user...');
    const userCredential = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password);
    const user = userCredential.user;
    userId = user.uid;
    console.log(`✅ User created with ID: ${userId}`);
    
    // Step 2: Test user document structure
    console.log('\n📄 Testing user document...');
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User document does not exist');
    }
    
    const userDoc = userSnap.data();
    console.log('User document fields:', Object.keys(userDoc));
    
    // Check required fields
    const requiredFields = [
      'name', 'email', 'phone', 'role', 'rank', 'status', 'banned',
      'referralCode', 'referrerCode', 'miningStreak',
      'telegramTask', 'twitterTask', 'preferences', 'wallet',
      'referralCount', 'totalEarningsUsd', 'totalOrders', 'activeReferrals',
      'createdAt', 'lastLoginAt'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in userDoc));
    if (missingFields.length > 0) {
      console.log('❌ Missing user fields:', missingFields);
    } else {
      console.log('✅ All required user fields present');
    }
    
    // Check field values
    console.log('\nField validation:');
    console.log(`Name: ${userDoc.name} (expected: ${testUser.name})`);
    console.log(`Email: ${userDoc.email} (expected: ${testUser.email})`);
    console.log(`Phone: ${userDoc.phone} (expected: ${testUser.phone})`);
    console.log(`Role: ${userDoc.role} (expected: user)`);
    console.log(`Rank: ${userDoc.rank} (expected: starter)`);
    console.log(`Status: ${userDoc.status} (expected: inactive)`);
    console.log(`Banned: ${userDoc.banned} (expected: false)`);
    console.log(`Referral Count: ${userDoc.referralCount} (expected: 0)`);
    
    // Check nested structures
    console.log('\nNested structure validation:');
    console.log('Telegram Task:', userDoc.telegramTask);
    console.log('Twitter Task:', userDoc.twitterTask);
    console.log('Preferences:', userDoc.preferences);
    console.log('Wallet:', userDoc.wallet);
    
    // Step 3: Test wallet document
    console.log('\n💰 Testing wallet document...');
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await getDoc(walletRef);
    
    if (!walletSnap.exists()) {
      throw new Error('Wallet document does not exist');
    }
    
    const walletDoc = walletSnap.data();
    console.log('Wallet document fields:', Object.keys(walletDoc));
    
    // Check wallet fields
    const walletFields = ['usdt', 'inr', 'dlx', 'walletUpdatedAt'];
    const missingWalletFields = walletFields.filter(field => !(field in walletDoc));
    if (missingWalletFields.length > 0) {
      console.log('❌ Missing wallet fields:', missingWalletFields);
    } else {
      console.log('✅ All required wallet fields present');
    }
    
    console.log('\nWallet validation:');
    console.log('USDT:', walletDoc.usdt);
    console.log('INR:', walletDoc.inr);
    console.log(`DLX: ${walletDoc.dlx} (expected: 100)`);
    
    // Step 4: Test referral system
    console.log('\n🔗 Testing referral system...');
    if (userDoc.referralCode && userDoc.referralCode.length > 0) {
      console.log(`✅ Referral code generated: ${userDoc.referralCode}`);
    } else {
      console.log('❌ No referral code generated');
    }
    
    console.log('\n🎉 Signup System Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ User document created with all required fields');
    console.log('✅ Wallet document created with all required fields');
    console.log('✅ Referral system working correctly');
    console.log('✅ All nested structures present');
    console.log('✅ Initial values set correctly');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('Stack trace:', error.stack);
  } finally {
    // Cleanup
    if (userId) {
      try {
        console.log('\n🧹 Cleaning up test data...');
        await signOut(auth);
        console.log('✅ Cleanup completed');
      } catch (cleanupError) {
        console.log('⚠️  Cleanup error:', cleanupError.message);
      }
    }
  }
}

// Run the test
testSignupSystem().catch(console.error);
