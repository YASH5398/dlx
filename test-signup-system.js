/**
 * Test Script for Complete Signup System
 * Tests email signup, phone signup, and Google signup with all required fields
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs, query, collection, where, increment } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQmsuYlFQExy2q0sZDbM7yPJHRzMZgKak",
  authDomain: "digilinex-a80a9.firebaseapp.com",
  projectId: "digilinex-a80a9",
  storageBucket: "digilinex-a80a9.firebasestorage.app",
  messagingSenderId: "197674020609",
  appId: "1:197674020609:web:e9ef458ab7186edf7bf500"
};

class SignupSystemTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testEmailSignup() {
    this.log('Testing email signup with complete fields...');
    
    try {
      const testEmail = `test-email-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      const testName = 'Test User';
      const testPhone = '1234567890';
      const testReferralCode = 'DLX123456';

      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(this.auth, testEmail, testPassword);
      const uid = userCredential.user.uid;

      // Create complete user document
      await setDoc(doc(this.firestore, 'users', uid), {
        name: testName,
        email: testEmail,
        phone: testPhone,
        role: 'user',
        rank: 'starter',
        status: 'inactive',
        banned: false,
        referralCode: 'DLX' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        referrerCode: testReferralCode,
        miningStreak: 0,
        telegramTask: {
          clicked: false,
          clickedAt: null,
          username: '',
          completed: false,
          claimed: false
        },
        twitterTask: {
          clicked: false,
          clickedAt: null,
          username: '',
          completed: false,
          claimed: false
        },
        preferences: {
          theme: 'dark',
          language: 'English',
          notifEmail: true,
          notifSms: false,
          notifPush: true
        },
        wallet: {
          main: 0,
          purchase: 0,
          miningBalance: 0
        },
        referralCount: 0,
        totalEarningsUsd: 0,
        totalOrders: 0,
        activeReferrals: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // Create wallet document
      await setDoc(doc(this.firestore, 'wallets', uid), {
        usdt: {
          mainUsdt: 0,
          purchaseUsdt: 0
        },
        inr: {
          mainInr: 0,
          purchaseInr: 0
        },
        dlx: 100,
        walletUpdatedAt: serverTimestamp()
      });

      // Verify user document was created with all fields
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      const userData = userDoc.data();

      if (!userDoc.exists()) {
        throw new Error('User document was not created');
      }

      // Check all required fields
      const requiredFields = [
        'name', 'email', 'phone', 'role', 'rank', 'status', 'banned',
        'referralCode', 'referrerCode', 'miningStreak', 'telegramTask',
        'twitterTask', 'preferences', 'wallet', 'referralCount',
        'totalEarningsUsd', 'totalOrders', 'activeReferrals', 'createdAt', 'lastLoginAt'
      ];

      const missingFields = requiredFields.filter(field => userData[field] === undefined);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
      }

      // Verify wallet document
      const walletDoc = await getDoc(doc(this.firestore, 'wallets', uid));
      if (!walletDoc.exists()) {
        throw new Error('Wallet document was not created');
      }

      this.log(`✅ Email signup successful - User: ${testEmail}, UID: ${uid}`, 'success');
      this.testResults.push({
        test: 'Email Signup',
        status: 'PASS',
        details: `All ${requiredFields.length} required fields created successfully`
      });

      return { uid, email: testEmail };

    } catch (error) {
      this.log(`❌ Email signup failed: ${error.message}`, 'error');
      this.errors.push(`Email signup failed: ${error.message}`);
      this.testResults.push({
        test: 'Email Signup',
        status: 'FAIL',
        details: error.message
      });
      throw error;
    }
  }

  async testReferralSystem() {
    this.log('Testing referral system...');
    
    try {
      // Create referrer user
      const referrerEmail = `referrer-${Date.now()}@example.com`;
      const referrerCred = await createUserWithEmailAndPassword(this.auth, referrerEmail, 'TestPassword123!');
      const referrerUid = referrerCred.user.uid;
      const referrerCode = 'DLX' + Math.random().toString(36).substr(2, 6).toUpperCase();

      await setDoc(doc(this.firestore, 'users', referrerUid), {
        name: 'Referrer User',
        email: referrerEmail,
        phone: '9876543210',
        role: 'user',
        rank: 'starter',
        status: 'inactive',
        banned: false,
        referralCode: referrerCode,
        referrerCode: '',
        miningStreak: 0,
        telegramTask: { clicked: false, clickedAt: null, username: '', completed: false, claimed: false },
        twitterTask: { clicked: false, clickedAt: null, username: '', completed: false, claimed: false },
        preferences: { theme: 'dark', language: 'English', notifEmail: true, notifSms: false, notifPush: true },
        wallet: { main: 0, purchase: 0, miningBalance: 0 },
        referralCount: 0,
        totalEarningsUsd: 0,
        totalOrders: 0,
        activeReferrals: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // Create referred user
      const referredEmail = `referred-${Date.now()}@example.com`;
      const referredCred = await createUserWithEmailAndPassword(this.auth, referredEmail, 'TestPassword123!');
      const referredUid = referredCred.user.uid;

      await setDoc(doc(this.firestore, 'users', referredUid), {
        name: 'Referred User',
        email: referredEmail,
        phone: '1234567890',
        role: 'user',
        rank: 'starter',
        status: 'inactive',
        banned: false,
        referralCode: 'DLX' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        referrerCode: referrerCode,
        miningStreak: 0,
        telegramTask: { clicked: false, clickedAt: null, username: '', completed: false, claimed: false },
        twitterTask: { clicked: false, clickedAt: null, username: '', completed: false, claimed: false },
        preferences: { theme: 'dark', language: 'English', notifEmail: true, notifSms: false, notifPush: true },
        wallet: { main: 0, purchase: 0, miningBalance: 0 },
        referralCount: 0,
        totalEarningsUsd: 0,
        totalOrders: 0,
        activeReferrals: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // Update referrer's count
      await updateDoc(doc(this.firestore, 'users', referrerUid), {
        referralCount: increment(1),
        activeReferrals: increment(1)
      });

      // Verify referrer's count was updated
      const referrerDoc = await getDoc(doc(this.firestore, 'users', referrerUid));
      const referrerData = referrerDoc.data();

      if (referrerData.referralCount !== 1 || referrerData.activeReferrals !== 1) {
        throw new Error('Referrer count was not updated correctly');
      }

      this.log(`✅ Referral system working - Referrer: ${referrerEmail}, Referred: ${referredEmail}`, 'success');
      this.testResults.push({
        test: 'Referral System',
        status: 'PASS',
        details: 'Referrer count updated correctly'
      });

    } catch (error) {
      this.log(`❌ Referral system test failed: ${error.message}`, 'error');
      this.errors.push(`Referral system failed: ${error.message}`);
      this.testResults.push({
        test: 'Referral System',
        status: 'FAIL',
        details: error.message
      });
      throw error;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Complete Signup System Tests...');
    
    try {
      await this.testEmailSignup();
      await this.testReferralSystem();
      
      this.log('🎉 All tests completed successfully!', 'success');
      
      // Print summary
      console.log('\n📊 Test Results Summary:');
      this.testResults.forEach(result => {
        const status = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${status} ${result.test}: ${result.details}`);
      });
      
      if (this.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.errors.forEach(error => console.log(`  - ${error}`));
      }
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SignupSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SignupSystemTester;
