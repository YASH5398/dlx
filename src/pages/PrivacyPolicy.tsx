import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, UserIcon, CogIcon, PhoneIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>DigiLinex – Privacy Policy</title>
        <meta name="description" content="Learn about DigiLinex's Terms and Privacy policies governing your use of our digital products, services, wallet, and referral system." />
        <meta name="keywords" content="DigiLinex, Privacy Policy, Data Protection, Digital Products, Affiliate Program, Wallet, Referral System, GDPR" />
        <meta property="og:title" content="DigiLinex – Privacy Policy" />
        <meta property="og:description" content="Learn about DigiLinex's Terms and Privacy policies governing your use of our digital products, services, wallet, and referral system." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DigiLinex – Privacy Policy" />
        <meta name="twitter:description" content="Learn about DigiLinex's Terms and Privacy policies governing your use of our digital products, services, wallet, and referral system." />
      </Helmet>
      <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
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
              <EyeIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
              <p className="text-gray-700 leading-relaxed">
                At DigiLinex ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our digital ecosystem platform.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Privacy Policy applies to all users of our platform, including those who access our website, mobile applications, and all related services. By using our Service, you consent to the data practices described in this policy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Information We Collect</h2>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, and profile details</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details, and transaction history</li>
                <li><strong>Wallet Information:</strong> Wallet balances, transaction records, and financial data</li>
                <li><strong>Referral Data:</strong> Referral codes, referral relationships, and commission tracking</li>
                <li><strong>Communication Data:</strong> Messages, support tickets, and correspondence with us</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">2.2 Usage Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We automatically collect certain information about your use of our Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, features used, and interaction patterns</li>
                <li><strong>Location Data:</strong> General geographic location based on IP address</li>
                <li><strong>Cookies and Tracking:</strong> Information collected through cookies and similar technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">2.3 Third-Party Information</h3>
              <p className="text-gray-700 leading-relaxed">
                We may receive information about you from third parties, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Social media platforms when you connect your accounts</li>
                <li>Payment processors for transaction verification</li>
                <li>Analytics providers for usage insights</li>
                <li>Referral partners and affiliates</li>
              </ul>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <CogIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. How We Use Your Information</h2>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">3.1 Service Provision</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information to provide, maintain, and improve our Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Process transactions and manage your accounts</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Deliver digital products and services</li>
                <li>Manage your wallet balances and transactions</li>
                <li>Track referral activities and calculate commissions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">3.2 Communication</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your contact information to communicate with you about:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Account updates and security notifications</li>
                <li>Transaction confirmations and receipts</li>
                <li>Service updates and new features</li>
                <li>Marketing communications (with your consent)</li>
                <li>Important policy changes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">3.3 Analytics and Improvement</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We analyze usage patterns to improve our Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Understand user behavior and preferences</li>
                <li>Optimize platform performance and features</li>
                <li>Develop new products and services</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <LockClosedIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">4. Information Sharing and Disclosure</h2>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">4.1 We Do Not Sell Your Information</h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-6">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  We do not sell, trade, or rent your personal information to third parties for their marketing purposes.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800">4.2 When We Share Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Trusted third parties who assist us in operating our platform</li>
                <li><strong>Payment Processors:</strong> To process transactions and prevent fraud</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">4.3 Data Processing Partners</h3>
              <p className="text-gray-700 leading-relaxed">
                We work with carefully selected partners who help us provide our Service. These partners are bound by strict confidentiality agreements and may only use your information for the specific purposes we authorize.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Data Security and Protection</h2>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">5.1 Security Measures</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement comprehensive security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication protocols</li>
                <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
                <li><strong>Secure Infrastructure:</strong> Cloud-based security with industry-standard practices</li>
                <li><strong>Employee Training:</strong> Regular security training for all team members</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">5.2 Data Breach Response</h3>
              <p className="text-gray-700 leading-relaxed">
                In the unlikely event of a data breach, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Notify affected users within 72 hours</li>
                <li>Report to relevant authorities as required by law</li>
                <li>Take immediate steps to contain and remediate the breach</li>
                <li>Provide guidance on protective measures users can take</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">5.3 Your Role in Security</h3>
              <p className="text-gray-700 leading-relaxed">
                You play an important role in keeping your information secure:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Use strong, unique passwords for your account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Keep your contact information up to date</li>
                <li>Report suspicious activity immediately</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Your Privacy Rights</h2>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">6.1 Access and Control</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
                <li><strong>Objection:</strong> Object to certain types of processing</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">6.2 Marketing Communications</h3>
              <p className="text-gray-700 leading-relaxed">
                You can opt out of marketing communications at any time by:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Clicking the unsubscribe link in emails</li>
                <li>Updating your preferences in your account settings</li>
                <li>Contacting our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">6.3 Exercising Your Rights</h3>
              <p className="text-gray-700 leading-relaxed">
                To exercise any of these rights, please contact us at privacy@digilinex.com. We will respond to your request within 30 days and may require verification of your identity.
              </p>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Cookies and Tracking Technologies</h2>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">7.1 Types of Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use various types of cookies and tracking technologies:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">7.2 Managing Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our platform.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Data Retention</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">8.1 Retention Periods</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your information for different periods depending on the type of data:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Until account deletion or 7 years after last activity</li>
                <li><strong>Transaction Data:</strong> 7 years for tax and compliance purposes</li>
                <li><strong>Communication Records:</strong> 3 years for customer service purposes</li>
                <li><strong>Analytics Data:</strong> 2 years in aggregated, anonymized form</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800">8.2 Deletion</h3>
              <p className="text-gray-700 leading-relaxed">
                When retention periods expire, we securely delete or anonymize your personal information. Some data may be retained longer if required by law or for legitimate business purposes.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses and adequacy decisions where applicable.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Children's Privacy</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <p className="text-gray-700 leading-relaxed">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
              </p>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date. Your continued use of our Service after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <PhoneIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">12. Contact Us</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Email: privacy@digilinex.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Support: Available 24/7 through our platform</span>
                </div>
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Data Protection Officer: dpo@digilinex.com</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              This Privacy Policy is effective as of the date last updated and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
