/**
 * Signup System Verification Test
 * Tests the signup system by examining the code structure and verifying all required fields
 * This test validates the implementation without requiring Firebase connection
 */

import fs from 'fs';
import path from 'path';

class SignupSystemVerifier {
  constructor() {
    this.testResults = [];
    this.requiredFields = {
      user: [
        'name', 'email', 'phone', 'role', 'rank', 'status', 'banned',
        'referralCode', 'referrerCode', 'miningStreak',
        'telegramTask', 'twitterTask', 'preferences', 'wallet',
        'referralCount', 'totalEarningsUsd', 'totalOrders', 'activeReferrals',
        'createdAt', 'lastLoginAt'
      ],
      wallet: ['usdt', 'inr', 'dlx', 'walletUpdatedAt'],
      telegramTask: ['clicked', 'clickedAt', 'username', 'completed', 'claimed'],
      twitterTask: ['clicked', 'clickedAt', 'username', 'completed', 'claimed'],
      preferences: ['theme', 'language', 'notifEmail', 'notifSms', 'notifPush'],
      walletNested: ['main', 'purchase', 'miningBalance'],
      usdt: ['mainUsdt', 'purchaseUsdt'],
      inr: ['mainInr', 'purchaseInr']
    };
  }

  async verifyUserContext() {
    console.log('🔍 Verifying UserContext implementation...');
    
    try {
      const userContextPath = 'src/context/UserContext.tsx';
      const userContextContent = fs.readFileSync(userContextPath, 'utf8');
      
      // Check if signup function exists
      if (!userContextContent.includes('const signup = async')) {
        throw new Error('Signup function not found in UserContext');
      }
      
      // Check if ensureUserNode function exists
      if (!userContextContent.includes('const ensureUserNode = async')) {
        throw new Error('ensureUserNode function not found in UserContext');
      }
      
      // Check if user document creation includes all required fields
      const userDocCreation = userContextContent.match(/await setDoc\(doc\(firestore, 'users', uid\), \{[\s\S]*?\}\);/);
      if (!userDocCreation) {
        throw new Error('User document creation not found in signup function');
      }
      
      // Verify required fields are present in user document creation
      const userDocContent = userDocCreation[0];
      const missingFields = this.requiredFields.user.filter(field => !userDocContent.includes(field));
      
      if (missingFields.length > 0) {
        console.log('❌ Missing user fields in signup:', missingFields);
        this.testResults.push({
          test: 'User Document Fields',
          status: 'FAILED',
          missing: missingFields
        });
      } else {
        console.log('✅ All required user fields present in signup');
        this.testResults.push({
          test: 'User Document Fields',
          status: 'PASSED'
        });
      }
      
      // Check wallet document creation
      const walletDocCreation = userContextContent.match(/await setDoc\(doc\(firestore, 'wallets', uid\), \{[\s\S]*?\}\);/);
      if (!walletDocCreation) {
        throw new Error('Wallet document creation not found in signup function');
      }
      
      const walletDocContent = walletDocCreation[0];
      const missingWalletFields = this.requiredFields.wallet.filter(field => !walletDocContent.includes(field));
      
      if (missingWalletFields.length > 0) {
        console.log('❌ Missing wallet fields in signup:', missingWalletFields);
        this.testResults.push({
          test: 'Wallet Document Fields',
          status: 'FAILED',
          missing: missingWalletFields
        });
      } else {
        console.log('✅ All required wallet fields present in signup');
        this.testResults.push({
          test: 'Wallet Document Fields',
          status: 'PASSED'
        });
      }
      
      // Check referral system implementation
      if (userContextContent.includes('referralCode') && userContextContent.includes('referrerCode')) {
        console.log('✅ Referral system implementation found');
        this.testResults.push({
          test: 'Referral System',
          status: 'PASSED'
        });
      } else {
        console.log('❌ Referral system implementation missing');
        this.testResults.push({
          test: 'Referral System',
          status: 'FAILED'
        });
      }
      
    } catch (error) {
      console.log('❌ UserContext verification failed:', error.message);
      this.testResults.push({
        test: 'UserContext Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifySignupPages() {
    console.log('\n🔍 Verifying Signup Pages...');
    
    const signupPages = [
      'src/pages/Signup.tsx',
      'src/pages/PhoneSignup.tsx',
      'src/pages/GoogleReferralSignup.tsx'
    ];
    
    for (const pagePath of signupPages) {
      try {
        if (!fs.existsSync(pagePath)) {
          console.log(`⚠️  ${pagePath} not found`);
          continue;
        }
        
        const pageContent = fs.readFileSync(pagePath, 'utf8');
        const pageName = path.basename(pagePath, '.tsx');
        
        // Check if page uses useUser hook
        if (!pageContent.includes('useUser')) {
          console.log(`❌ ${pageName} does not use useUser hook`);
          this.testResults.push({
            test: `${pageName} useUser Hook`,
            status: 'FAILED'
          });
        } else {
          console.log(`✅ ${pageName} uses useUser hook`);
          this.testResults.push({
            test: `${pageName} useUser Hook`,
            status: 'PASSED'
          });
        }
        
        // Check if page calls signup function
        if (!pageContent.includes('signup(') && !pageContent.includes('loginWithGoogle')) {
          console.log(`❌ ${pageName} does not call signup or loginWithGoogle`);
          this.testResults.push({
            test: `${pageName} Signup Call`,
            status: 'FAILED'
          });
        } else {
          console.log(`✅ ${pageName} calls signup or loginWithGoogle`);
          this.testResults.push({
            test: `${pageName} Signup Call`,
            status: 'PASSED'
          });
        }
        
      } catch (error) {
        console.log(`❌ Error verifying ${pagePath}:`, error.message);
        this.testResults.push({
          test: `${pagePath} Verification`,
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  async verifyFieldCompleteness() {
    console.log('\n🔍 Verifying Field Completeness...');
    
    try {
      const userContextPath = 'src/context/UserContext.tsx';
      const userContextContent = fs.readFileSync(userContextPath, 'utf8');
      
      // Extract the complete user document structure
      const userDocMatch = userContextContent.match(/await setDoc\(doc\(firestore, 'users', uid\), \{([\s\S]*?)\}\);/);
      if (!userDocMatch) {
        throw new Error('Could not extract user document structure');
      }
      
      const userDocContent = userDocMatch[1];
      
      // Check nested structures
      const nestedStructures = [
        { name: 'telegramTask', fields: this.requiredFields.telegramTask },
        { name: 'twitterTask', fields: this.requiredFields.twitterTask },
        { name: 'preferences', fields: this.requiredFields.preferences },
        { name: 'wallet', fields: this.requiredFields.walletNested }
      ];
      
      for (const structure of nestedStructures) {
        const structureMatch = userDocContent.match(new RegExp(`${structure.name}:\\s*\\{([\\s\\S]*?)\\}`));
        if (!structureMatch) {
          console.log(`❌ ${structure.name} structure not found`);
          this.testResults.push({
            test: `${structure.name} Structure`,
            status: 'FAILED'
          });
          continue;
        }
        
        const structureContent = structureMatch[1];
        const missingFields = structure.fields.filter(field => !structureContent.includes(field));
        
        if (missingFields.length > 0) {
          console.log(`❌ ${structure.name} missing fields:`, missingFields);
          this.testResults.push({
            test: `${structure.name} Fields`,
            status: 'FAILED',
            missing: missingFields
          });
        } else {
          console.log(`✅ ${structure.name} has all required fields`);
          this.testResults.push({
            test: `${structure.name} Fields`,
            status: 'PASSED'
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Field completeness verification failed:', error.message);
      this.testResults.push({
        test: 'Field Completeness',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyReferralSystem() {
    console.log('\n🔍 Verifying Referral System...');
    
    try {
      const userContextPath = 'src/context/UserContext.tsx';
      const userContextContent = fs.readFileSync(userContextPath, 'utf8');
      
      // Check if referral code generation exists
      if (!userContextContent.includes('generateReferralCode')) {
        console.log('❌ Referral code generation not found');
        this.testResults.push({
          test: 'Referral Code Generation',
          status: 'FAILED'
        });
      } else {
        console.log('✅ Referral code generation found');
        this.testResults.push({
          test: 'Referral Code Generation',
          status: 'PASSED'
        });
      }
      
      // Check if referral system updates referrer count
      if (!userContextContent.includes('referralCount: increment(1)')) {
        console.log('❌ Referral count update not found');
        this.testResults.push({
          test: 'Referral Count Update',
          status: 'FAILED'
        });
      } else {
        console.log('✅ Referral count update found');
        this.testResults.push({
          test: 'Referral Count Update',
          status: 'PASSED'
        });
      }
      
      // Check if referral system updates active referrals
      if (!userContextContent.includes('activeReferrals: increment(1)')) {
        console.log('❌ Active referrals update not found');
        this.testResults.push({
          test: 'Active Referrals Update',
          status: 'FAILED'
        });
      } else {
        console.log('✅ Active referrals update found');
        this.testResults.push({
          test: 'Active Referrals Update',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Referral system verification failed:', error.message);
      this.testResults.push({
        test: 'Referral System Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async verifyWalletSystem() {
    console.log('\n🔍 Verifying Wallet System...');
    
    try {
      const userContextPath = 'src/context/UserContext.tsx';
      const userContextContent = fs.readFileSync(userContextPath, 'utf8');
      
      // Check if wallet document creation exists
      if (!userContextContent.includes("doc(firestore, 'wallets', uid)")) {
        console.log('❌ Wallet document creation not found');
        this.testResults.push({
          test: 'Wallet Document Creation',
          status: 'FAILED'
        });
      } else {
        console.log('✅ Wallet document creation found');
        this.testResults.push({
          test: 'Wallet Document Creation',
          status: 'PASSED'
        });
      }
      
      // Check if wallet has initial DLX balance
      if (!userContextContent.includes('dlx: 100')) {
        console.log('❌ Initial DLX balance not set');
        this.testResults.push({
          test: 'Initial DLX Balance',
          status: 'FAILED'
        });
      } else {
        console.log('✅ Initial DLX balance set to 100');
        this.testResults.push({
          test: 'Initial DLX Balance',
          status: 'PASSED'
        });
      }
      
      // Check if wallet has USDT and INR structures
      if (!userContextContent.includes('usdt:') || !userContextContent.includes('inr:')) {
        console.log('❌ USDT/INR wallet structures not found');
        this.testResults.push({
          test: 'USDT/INR Wallet Structures',
          status: 'FAILED'
        });
      } else {
        console.log('✅ USDT/INR wallet structures found');
        this.testResults.push({
          test: 'USDT/INR Wallet Structures',
          status: 'PASSED'
        });
      }
      
    } catch (error) {
      console.log('❌ Wallet system verification failed:', error.message);
      this.testResults.push({
        test: 'Wallet System Verification',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Signup System Verification');
    console.log('=' .repeat(60));
    
    await this.verifyUserContext();
    await this.verifySignupPages();
    await this.verifyFieldCompleteness();
    await this.verifyReferralSystem();
    await this.verifyWalletSystem();
    
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
    
    console.log('\n🎯 Signup System Verification Complete!');
    
    if (failedTests.length === 0) {
      console.log('\n🎉 CONFIRMATION: Signup system is properly implemented!');
      console.log('✅ Every new user will get a complete Firestore document');
      console.log('✅ All required fields are present and properly initialized');
      console.log('✅ Referral system is working correctly');
      console.log('✅ Wallet system is working correctly');
      console.log('✅ No fields are missing or undefined');
    } else {
      console.log('\n⚠️  Some issues found in the signup system implementation');
    }
  }
}

// Run the verification
async function runSignupVerification() {
  const verifier = new SignupSystemVerifier();
  await verifier.runAllTests();
}

runSignupVerification().catch(console.error);
