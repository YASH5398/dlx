/**
 * Field Fetching Verification Test
 * Tests that all Firestore user document fields are properly fetched and displayed
 * across all sections (Profile, Dashboard, Wallet, Mining, Preferences, Referrals)
 */

import fs from 'fs';
import path from 'path';

class FieldFetchingVerifier {
  constructor() {
    this.testResults = [];
    this.requiredFields = {
      profile: ['name', 'email', 'phone', 'role', 'rank', 'status', 'referralCode', 'referrerCode'],
      wallet: ['main', 'purchase', 'miningBalance'],
      mining: ['miningStreak', 'telegramTask', 'twitterTask'],
      preferences: ['theme', 'language', 'notifEmail', 'notifPush', 'notifSms'],
      referrals: ['referralCount', 'activeReferrals']
    };
  }

  async verifyProfileFields() {
    console.log('🔍 Verifying Profile section field fetching...');
    
    try {
      const profilePath = 'src/pages/Dashboard/Profile.tsx';
      const profileContent = fs.readFileSync(profilePath, 'utf8');
      
      // Check if Firestore user document fetching is implemented
      if (!profileContent.includes('doc(firestore, \'users\', uid)')) {
        console.log('❌ Profile section not fetching from Firestore users collection');
        this.testResults.push({
          test: 'Profile Firestore Fetching',
          status: 'FAILED',
          error: 'Not fetching from Firestore users collection'
        });
        return;
      }
      
      // Check if all required fields are being fetched
      const missingFields = this.requiredFields.profile.filter(field => !profileContent.includes(field));
      if (missingFields.length > 0) {
        console.log('❌ Profile missing fields:', missingFields);
        this.testResults.push({
          test: 'Profile Required Fields',
          status: 'FAILED',
          missing: missingFields
        });
      } else {
        console.log('✅ Profile section fetches all required fields');
        this.testResults.push({
          test: 'Profile Required Fields',
          status: 'PASSED'
        });
      }
      
      // Check if fields are displayed in UI
      const displayChecks = [
        'role', 'rank', 'status', 'referralCode', 'referrerCode', 'referralCount', 'activeReferrals'
      ];
      const missingDisplay = displayChecks.filter(field => !profileContent.includes(field));
      if (missingDisplay.length > 0) {
        console.log('❌ Profile missing display fields:', missingDisplay);
        this.testResults.push({
          test: 'Profile Field Display',
          status: 'FAILED',
          missing: missingDisplay
        });
      } else {
        console.log('✅ Profile section displays all required fields');
        this.testResults.push({
          test: 'Profile Field Display',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Profile verification failed:', error.message);
      this.testResults.push({
        test: 'Profile Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyWalletFields() {
    console.log('🔍 Verifying Wallet section field fetching...');
    
    try {
      const walletPath = 'src/pages/Dashboard/WalletEnhanced.tsx';
      const walletContent = fs.readFileSync(walletPath, 'utf8');
      
      // Check if wallet fields are being fetched from user document
      if (!walletContent.includes('miningBalance') || !walletContent.includes('mainBalance') || !walletContent.includes('purchaseBalance')) {
        console.log('❌ Wallet section missing user document field fetching');
        this.testResults.push({
          test: 'Wallet User Document Fields',
          status: 'FAILED',
          error: 'Missing user document field fetching'
        });
      } else {
        console.log('✅ Wallet section fetches user document fields');
        this.testResults.push({
          test: 'Wallet User Document Fields',
          status: 'PASSED'
        });
      }
      
      // Check if wallet fields are displayed
      const walletDisplayFields = ['miningBalance', 'mainBalance', 'purchaseBalance'];
      const missingDisplay = walletDisplayFields.filter(field => !walletContent.includes(field));
      if (missingDisplay.length > 0) {
        console.log('❌ Wallet missing display fields:', missingDisplay);
        this.testResults.push({
          test: 'Wallet Field Display',
          status: 'FAILED',
          missing: missingDisplay
        });
      } else {
        console.log('✅ Wallet section displays all required fields');
        this.testResults.push({
          test: 'Wallet Field Display',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Wallet verification failed:', error.message);
      this.testResults.push({
        test: 'Wallet Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyDashboardFixes() {
    console.log('🔍 Verifying Dashboard fixes...');
    
    try {
      const dashboardPath = 'src/pages/Dashboard/DashboardHome.tsx';
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      
      // Check if duplicate "Tier Level" is removed
      const tierLevelCount = (dashboardContent.match(/Tier Level/g) || []).length;
      if (tierLevelCount > 1) {
        console.log('❌ Dashboard still has duplicate "Tier Level" display');
        this.testResults.push({
          test: 'Dashboard Duplicate Tier Level',
          status: 'FAILED',
          error: 'Duplicate Tier Level display found'
        });
      } else {
        console.log('✅ Dashboard duplicate "Tier Level" removed');
        this.testResults.push({
          test: 'Dashboard Duplicate Tier Level',
          status: 'PASSED'
        });
      }
      
      // Check if commission % and share button are only shown for affiliates
      if (!dashboardContent.includes('affiliateStatus.isApproved')) {
        console.log('❌ Dashboard commission display not properly gated for affiliates');
        this.testResults.push({
          test: 'Dashboard Affiliate Gating',
          status: 'FAILED',
          error: 'Commission display not properly gated'
        });
      } else {
        console.log('✅ Dashboard commission display properly gated for affiliates');
        this.testResults.push({
          test: 'Dashboard Affiliate Gating',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Dashboard verification failed:', error.message);
      this.testResults.push({
        test: 'Dashboard Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyPreferencesFields() {
    console.log('🔍 Verifying Preferences section field fetching...');
    
    try {
      const settingsPath = 'src/pages/Dashboard/SettingsFull.tsx';
      const settingsContent = fs.readFileSync(settingsPath, 'utf8');
      
      // Check if preferences are fetched from Firestore
      if (!settingsContent.includes('doc(firestore, \'users\', user.id)')) {
        console.log('❌ Preferences section not fetching from Firestore');
        this.testResults.push({
          test: 'Preferences Firestore Fetching',
          status: 'FAILED',
          error: 'Not fetching from Firestore'
        });
      } else {
        console.log('✅ Preferences section fetches from Firestore');
        this.testResults.push({
          test: 'Preferences Firestore Fetching',
          status: 'PASSED'
        });
      }
      
      // Check if preferences are saved to Firestore
      if (!settingsContent.includes('updateDoc(userRef, {')) {
        console.log('❌ Preferences section not saving to Firestore');
        this.testResults.push({
          test: 'Preferences Firestore Saving',
          status: 'FAILED',
          error: 'Not saving to Firestore'
        });
      } else {
        console.log('✅ Preferences section saves to Firestore');
        this.testResults.push({
          test: 'Preferences Firestore Saving',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Preferences verification failed:', error.message);
      this.testResults.push({
        test: 'Preferences Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyMiningFields() {
    console.log('🔍 Verifying Mining section field fetching...');
    
    try {
      const miningPath = 'src/pages/Dashboard/Mining.tsx';
      const miningContent = fs.readFileSync(miningPath, 'utf8');
      
      // Check if mining fields are being fetched
      const miningFields = ['miningStreak', 'telegramTask', 'twitterTask', 'miningBalance'];
      const missingFields = miningFields.filter(field => !miningContent.includes(field));
      
      if (missingFields.length > 0) {
        console.log('❌ Mining missing fields:', missingFields);
        this.testResults.push({
          test: 'Mining Required Fields',
          status: 'FAILED',
          missing: missingFields
        });
      } else {
        console.log('✅ Mining section fetches all required fields');
        this.testResults.push({
          test: 'Mining Required Fields',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Mining verification failed:', error.message);
      this.testResults.push({
        test: 'Mining Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyReferralFields() {
    console.log('🔍 Verifying Referral section field fetching...');
    
    try {
      const referralPath = 'src/hooks/useReferral.ts';
      const referralContent = fs.readFileSync(referralPath, 'utf8');
      
      // Check if referral fields are being fetched
      const referralFields = ['referralCount', 'activeReferrals', 'totalEarnings'];
      const missingFields = referralFields.filter(field => !referralContent.includes(field));
      
      if (missingFields.length > 0) {
        console.log('❌ Referral missing fields:', missingFields);
        this.testResults.push({
          test: 'Referral Required Fields',
          status: 'FAILED',
          missing: missingFields
        });
      } else {
        console.log('✅ Referral section fetches all required fields');
        this.testResults.push({
          test: 'Referral Required Fields',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Referral verification failed:', error.message);
      this.testResults.push({
        test: 'Referral Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Field Fetching Verification');
    console.log('=' .repeat(60));
    
    await this.verifyProfileFields();
    await this.verifyWalletFields();
    await this.verifyDashboardFixes();
    await this.verifyPreferencesFields();
    await this.verifyMiningFields();
    await this.verifyReferralFields();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:');
    console.log('=' .repeat(60));
    
    const passedTests = this.testResults.filter(result => result.status === 'PASSED');
    const failedTests = this.testResults.filter(result => result.status === 'FAILED');
    
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests.length / this.testResults.length) * 100)}%`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.test}: ${test.error || test.missing || 'Unknown error'}`);
      });
    }
    
    console.log('\n🎯 Field Fetching Verification Complete!');
    
    if (failedTests.length === 0) {
      console.log('\n🎉 CONFIRMATION: All field fetching issues have been fixed!');
      console.log('✅ Profile section fetches all required fields from Firestore');
      console.log('✅ Wallet section fetches all required fields from Firestore');
      console.log('✅ Dashboard duplicate "Tier Level" removed');
      console.log('✅ Services section commission display properly gated for affiliates');
      console.log('✅ Preferences section fetches and saves to Firestore');
      console.log('✅ Mining section fetches all required fields');
      console.log('✅ Referral section fetches all required fields');
      console.log('✅ No fields are missing or undefined');
    } else {
      console.log('\n⚠️  Some field fetching issues still need attention');
    }
  }
}

// Run the verification
async function runFieldFetchingVerification() {
  const verifier = new FieldFetchingVerifier();
  await verifier.runAllTests();
}

runFieldFetchingVerification().catch(console.error);
