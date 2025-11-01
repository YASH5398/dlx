// Simple script to seed services
// Run with: node scripts/seedServices.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp, collection, getDocs } = require('firebase/firestore');

// You'll need to add your Firebase config here
const firebaseConfig = {
  // Add your actual Firebase config
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Safety: prevent accidental writes to production unless explicitly allowed
const PROJECT_GUARD = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || '';
const PROD_IDS = new Set(['digilinex-a80a9', 'digilinex-prod']);
if (PROD_IDS.has(PROJECT_GUARD) && process.env.ALLOW_PROD_WRITE !== 'true') {
  console.error(`\n❌ Refusing to run seedServices against production project: ${PROJECT_GUARD}. Set ALLOW_PROD_WRITE=true to override intentionally.\n`);
  process.exit(1);
}

const services = [
  { id: 'token', title: 'Token Creation', description: 'Create crypto token', price: '$100', category: 'Crypto', icon: '🪙', isActive: true },
  { id: 'website', title: 'Website Development', description: 'Build website', price: '$200', category: 'Web', icon: '🌐', isActive: true },
  { id: 'chatbot', title: 'Chatbot Development', description: 'Custom chatbot', price: '$150', category: 'Automation', icon: '🤖', isActive: true },
  { id: 'mlm', title: 'MLM Platform', description: 'Design MLM system', price: '$500', category: 'Business', icon: '📈', isActive: true },
  { id: 'mobile', title: 'Mobile App', description: 'iOS/Android app', price: '$300', category: 'App', icon: '📱', isActive: true },
  { id: 'automation', title: 'Automation', description: 'Automate processes', price: '$100', category: 'Automation', icon: '⚙️', isActive: true },
  { id: 'telegram', title: 'Telegram Bot', description: 'Custom telegram bot', price: '$80', category: 'Bot', icon: '💬', isActive: true },
  { id: 'audit', title: 'Audit', description: 'Smart contract or token audit', price: '$200', category: 'Security', icon: '🛡️', isActive: true },
  // New high-ticket services
  { id: 'landing-page', title: 'Landing Page Creation', description: 'Create a responsive and high-converting landing page with custom design, layout, and hosting-ready setup.', price: '$45 / ₹4,000', category: 'Web Development', icon: '🎨', isActive: true },
  { id: 'ecommerce-store', title: 'E-commerce Store Setup', description: 'Launch a full-featured e-commerce store with payment integration, product setup, and basic SEO optimization.', price: '$190 / ₹16,000', category: 'Web Development', icon: '🛒', isActive: true },
  { id: 'tradingview-indicator', title: 'TradingView Custom Indicator / Strategy', description: 'Get your personalized TradingView indicator or strategy with alerts and backtesting for automated trading.', price: '$30 / ₹2,500', category: 'Crypto', icon: '📈', isActive: true },
  { id: 'social-media-management', title: 'Social Media Management', description: 'Full monthly social media management with content creation, post scheduling, and engagement tracking.', price: '$20 / ₹1,700 per month', category: 'Marketing', icon: '📱', isActive: true },
  { id: 'seo-services', title: 'SEO Services', description: 'Optimize your website for better search engine visibility with technical and on-page SEO improvements.', price: '$50 / ₹4,200', category: 'Marketing', icon: '🔍', isActive: true },
  { id: 'digital-marketing-campaigns', title: 'Digital Marketing Campaigns', description: 'Setup and manage FB/IG/Google Ads campaigns with creatives, targeting, and performance tracking.', price: '$20 / ₹1,700', category: 'Marketing', icon: '📊', isActive: true },
  { id: 'video-editing', title: 'Video Editing Service', description: 'Professional video editing for YouTube, Reels, or promotional content with high-quality output.', price: '$15 / ₹1,300', category: 'Media', icon: '🎬', isActive: true },
  { id: 'daily-thumbnails', title: 'Daily Thumbnails Service', description: 'Custom thumbnail creation daily for your YouTube videos or content platform for 30/60 days.', price: '$5 / ₹450 per thumbnail', category: 'Media', icon: '🖼️', isActive: true },
  { id: 'email-marketing-setup', title: 'Automated Email Marketing Setup', description: 'Setup automated email campaigns with workflows, templates, and integrations for better engagement.', price: '$30 / ₹2,500', category: 'Marketing', icon: '📧', isActive: true },
  { id: 'whatsapp-marketing-software', title: 'WhatsApp Marketing Hidden Software', description: 'Get a cost-effective WhatsApp marketing software without API cost, fully automated for campaigns.', price: '$30 / ₹2,500', category: 'Marketing', icon: '💬', isActive: true },
];

async function seedServices() {
  console.log('🚀 Starting service seeding...');
  console.log('Project:', PROJECT_GUARD || 'unknown');
  
  try {
    for (const service of services) {
      await setDoc(doc(firestore, 'services', service.id), {
        title: service.title,
        description: service.description,
        category: service.category,
        icon: service.icon,
        price: service.price,
        isActive: service.isActive ?? true,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Added: ${service.title}`);
    }

    const snapshot = await getDocs(collection(firestore, 'services'));
    console.log(`🎉 Successfully seeded ${snapshot.size} services!`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seedServices();
