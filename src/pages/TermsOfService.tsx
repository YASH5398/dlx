import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheckIcon, DocumentTextIcon, ExclamationTriangleIcon, UserGroupIcon, CurrencyDollarIcon, CogIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function TermsOfService() {
  return (
    <>
      <Helmet>
        <title>DigiLinex – Terms of Service</title>
        <meta name="description" content="Learn about DigiLinex's Terms and Privacy policies governing your use of our digital products, services, wallet, and referral system." />
        <meta name="keywords" content="DigiLinex, Terms of Service, Digital Products, Affiliate Program, Wallet, Referral System, Privacy Policy" />
        <meta property="og:title" content="DigiLinex – Terms of Service" />
        <meta property="og:description" content="Learn about DigiLinex's Terms and Privacy policies governing your use of our digital products, services, wallet, and referral system." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DigiLinex – Terms of Service" />
        <meta name="twitter:description" content="Learn about DigiLinex's Terms and Privacy policies governing your use of our digital products, services, wallet, and referral system." />
      </Helmet>
      <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
              <p className="text-gray-700 leading-relaxed">
                Welcome to DigiLinex ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our digital ecosystem platform, including our website, mobile applications, and all related services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              DigiLinex is a comprehensive digital platform that provides database access, marketing tools, multi-wallet systems, affiliate programs, and digital product marketplace services. Our platform enables users to grow their digital businesses through various earning opportunities and business tools.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you do not agree to these Terms, please do not use our Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          {/* Account Registration */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Account Registration & User Responsibilities</h2>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">2.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed">
                To access our Service, you must create an account by providing accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800">2.2 User Information</h3>
              <p className="text-gray-700 leading-relaxed">
                You agree to provide and maintain accurate information including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Valid email address and phone number</li>
                <li>Complete profile information</li>
                <li>Payment and wallet information</li>
                <li>Referral code information (if applicable)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">2.3 Prohibited Activities</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Creating multiple accounts or using false information</li>
                <li>Attempting to manipulate our referral or affiliate system</li>
                <li>Engaging in fraudulent transactions or money laundering</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Infringing upon intellectual property rights</li>
                <li>Distributing malware or harmful code</li>
                <li>Attempting to gain unauthorized access to our systems</li>
              </ul>
            </div>
          </section>

          {/* Services Description */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <CogIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Our Services</h2>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">3.1 Digital Products & Database Access</h3>
              <p className="text-gray-700 leading-relaxed">
                We provide access to 30+ specialized database categories, digital products, and marketing tools. All purchases are final unless otherwise specified. Digital products are delivered instantly upon successful payment.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">3.2 Multi-Wallet System</h3>
              <p className="text-gray-700 leading-relaxed">
                Our platform features three specialized wallets:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Main Wallet:</strong> Primary balance for transactions and withdrawals</li>
                <li><strong>Purchase Wallet:</strong> Dedicated for product and service purchases</li>
                <li><strong>Mining Wallet:</strong> Accumulates DLX tokens through mining activities</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">3.3 Affiliate & Referral Program</h3>
              <p className="text-gray-700 leading-relaxed">
                Our affiliate program allows users to earn commissions through referrals. Commission rates range from 20% to 45% based on user rank. All referral activities are tracked and monitored for compliance.
              </p>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">4. Payment Terms & Refunds</h2>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">4.1 Payment Methods</h3>
              <p className="text-gray-700 leading-relaxed">
                We accept payments through various methods including bank transfers, UPI, and cryptocurrency (USDT). All payments are processed securely through our integrated payment systems.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">4.2 Pricing & Currency</h3>
              <p className="text-gray-700 leading-relaxed">
                Prices are displayed in USDT and INR. Currency conversion rates are updated regularly. We reserve the right to change prices at any time with reasonable notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">4.3 Refund Policy</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Digital Products:</strong> Due to the nature of digital products, all sales are final. Refunds may be considered only in cases of technical issues preventing product delivery.
                </p>
                <p className="text-gray-700 leading-relaxed mt-3">
                  <strong>Services:</strong> Refund eligibility depends on the specific service and circumstances. Contact our support team for refund requests.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800">4.4 Withdrawals</h3>
              <p className="text-gray-700 leading-relaxed">
                Withdrawal requests are processed within 3-7 business days. Minimum withdrawal amounts and processing fees apply. We reserve the right to verify withdrawal requests for security purposes.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Intellectual Property Rights</h2>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">5.1 Our Content</h3>
              <p className="text-gray-700 leading-relaxed">
                All content on our platform, including text, graphics, logos, software, and databases, is owned by DigiLinex or our licensors and is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">5.2 User-Generated Content</h3>
              <p className="text-gray-700 leading-relaxed">
                You retain ownership of content you create and share on our platform. By using our Service, you grant us a non-exclusive, royalty-free license to use, modify, and display your content for the purpose of providing our services.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">5.3 Database Rights</h3>
              <p className="text-gray-700 leading-relaxed">
                Our databases and data products are proprietary. Purchasing access to our databases does not transfer ownership rights. You may use the data for legitimate business purposes only.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">6. Limitation of Liability & Disclaimers</h2>
            </div>
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <p className="text-gray-700 leading-relaxed font-semibold">
                IMPORTANT: Please read this section carefully as it limits our liability to you.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">6.1 Service Availability</h3>
              <p className="text-gray-700 leading-relaxed">
                We strive to maintain continuous service availability but cannot guarantee uninterrupted access. We are not liable for any downtime, data loss, or service interruptions.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">6.2 Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, DigiLinex shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">6.3 Maximum Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                Our total liability to you for any claims arising from these Terms or your use of our Service shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Termination</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">7.1 Termination by You</h3>
              <p className="text-gray-700 leading-relaxed">
                You may terminate your account at any time by contacting our support team. Upon termination, your access to our Service will cease, but certain provisions of these Terms will survive.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">7.2 Termination by Us</h3>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activities, or if required by law. We will provide reasonable notice when possible.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">7.3 Effect of Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                Upon termination, your right to use the Service ceases immediately. We may delete your account data after a reasonable period, subject to our data retention policies.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Governing Law & Dispute Resolution</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">8.1 Governing Law</h3>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of [Jurisdiction], without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-gray-800">8.2 Dispute Resolution</h3>
              <p className="text-gray-700 leading-relaxed">
                Any disputes arising from these Terms or your use of our Service shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization]. The arbitration shall be conducted in [City, Jurisdiction].
              </p>

              <h3 className="text-xl font-semibold text-gray-800">8.3 Class Action Waiver</h3>
              <p className="text-gray-700 leading-relaxed">
                You agree that any arbitration or court proceeding shall be limited to the dispute between you and DigiLinex individually. You waive any right to participate in class action lawsuits or class-wide arbitration.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time to reflect changes in our Service or legal requirements. We will notify you of material changes by email or through our platform. Your continued use of our Service after such changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <PhoneIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">10. Contact Information</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Email: support@digilinex.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Support: Available 24/7 through our platform</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              These Terms of Service are effective as of the date last updated and will remain in effect except with respect to any changes in their provisions in the future, which will be in effect immediately after being posted on this page.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
