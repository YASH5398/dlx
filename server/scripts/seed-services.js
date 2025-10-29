import 'dotenv/config';
import admin from 'firebase-admin';
import { firestore as adminDb } from '../firebaseAdmin.js';

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Define all 18 services with unique thumbnails and concise descriptions
const services = [
  // Web Development (4)
  {
    title: 'Landing Page Creation',
    price: '$45 / ₹4,000',
    price_usd: 45,
    price_inr: 4000,
    commission: 20,
    rating: 4.8,
    category: 'Web Development',
    description: 'High-converting, responsive landing page with modern UI and fast load time.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'E-commerce Store Setup',
    price: '$190 / ₹16,000',
    price_usd: 190,
    price_inr: 16000,
    commission: 20,
    rating: 4.8,
    category: 'Web Development',
    description: 'Full-featured store with products, checkout, and payment integration.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Website Development',
    price: '$1,499',
    price_usd: 1499,
    price_inr: 124000,
    commission: 20,
    rating: 4.8,
    category: 'Web Development',
    description: 'Custom multi-page website, SEO-friendly, optimized for performance.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Business Website Setup',
    price: '$150 / ₹12,500',
    price_usd: 150,
    price_inr: 12500,
    commission: 20,
    rating: 4.8,
    category: 'Web Development',
    description: 'Clean business site with essential pages, contact form, and branding.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=1200&auto=format&fit=crop',
  },

  // Crypto (3)
  {
    title: 'Crypto Token Creation',
    price: '$2,999',
    price_usd: 2999,
    price_inr: 250000,
    commission: 20,
    rating: 4.8,
    category: 'Crypto',
    description: 'Deploy secure ERC/BEP token with mint/burn and verified contract.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1640340434865-7341e5e88dfe?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'TradingView Custom Indicator / Strategy',
    price: '$30 / ₹2,500',
    price_usd: 30,
    price_inr: 2500,
    commission: 20,
    rating: 4.8,
    category: 'Crypto',
    description: 'Custom Pine Script indicators and strategies for TradingView.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1641932397724-6f0ca6e69a34?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Crypto Audit',
    price: '$2,499',
    price_usd: 2499,
    price_inr: 207000,
    commission: 20,
    rating: 4.8,
    category: 'Crypto',
    description: 'Contract audit and vulnerability analysis with clear remediation steps.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1640622653157-0ed1a7c0183d?q=80&w=1200&auto=format&fit=crop',
  },

  // Marketing (6)
  {
    title: 'Social Media Management',
    price: '$20 / ₹1,700 per month',
    price_usd: 20,
    price_inr: 1700,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Content scheduling, captions, and basic engagement for your brand.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'SEO Services',
    price: '$50 / ₹4,200',
    price_usd: 50,
    price_inr: 4200,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'On-page SEO, keyword mapping, and technical fixes to improve ranking.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Digital Marketing Campaigns',
    price: '$20 / ₹1,700',
    price_usd: 20,
    price_inr: 1700,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Performance-based ad campaigns with targeting and creatives setup.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Automated Email Marketing Setup',
    price: '$30 / ₹2,500',
    price_usd: 30,
    price_inr: 2500,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Flows, templates, and provider integration (Mailchimp/SendGrid).',
    thumbnailUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'WhatsApp Marketing Hidden Software',
    price: '$30 / ₹2,500',
    price_usd: 30,
    price_inr: 2500,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Low-cost automation for WA message campaigns with easy setup.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Lead Generation Campaign Setup',
    price: '$25 / ₹2,000',
    price_usd: 25,
    price_inr: 2000,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Lead forms, tracking, and audience setup for qualified leads.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?q=80&w=1200&auto=format&fit=crop',
  },

  // Media (2)
  {
    title: 'Video Editing Service',
    price: '$15 / ₹1,300',
    price_usd: 15,
    price_inr: 1300,
    commission: 20,
    rating: 4.8,
    category: 'Media',
    description: 'Cuts, transitions, music, and export for YouTube/shorts formats.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Daily Thumbnails Service',
    price: '$5 / ₹450 per thumbnail',
    price_usd: 5,
    price_inr: 450,
    commission: 20,
    rating: 4.8,
    category: 'Media',
    description: 'CTR-optimized thumbnails for daily posting and brand consistency.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510227272981-87123e259b17?q=80&w=1200&auto=format&fit=crop',
  },

  // AI & Automation (3)
  {
    title: 'Chatbot Development',
    price: '$999',
    price_usd: 999,
    price_inr: 83000,
    commission: 20,
    rating: 4.8,
    category: 'AI & Automation',
    description: 'AI/Rule-based chatbots for web and messaging platforms.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Business Automation',
    price: '$1,999',
    price_usd: 1999,
    price_inr: 166000,
    commission: 20,
    rating: 4.8,
    category: 'AI & Automation',
    description: 'Workflow automation and integrations to reduce manual operations.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Telegram Bot',
    price: '$799',
    price_usd: 799,
    price_inr: 66300,
    commission: 20,
    rating: 4.8,
    category: 'AI & Automation',
    description: 'Custom Telegram bots with commands, menus, and integrations.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600267175161-cfaa711b4a81?q=80&w=1200&auto=format&fit=crop',
  },

  // MLM & Mobile (2)
  {
    title: 'MLM Website Setup',
    price: '$699',
    price_usd: 699,
    price_inr: 58000,
    commission: 20,
    rating: 4.8,
    category: 'MLM & Mobile',
    description: 'MLM-ready website with plans, genealogy, and wallet modules.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Android App (Linked with Website)',
    price: '$899',
    price_usd: 899,
    price_inr: 74500,
    commission: 20,
    rating: 4.8,
    category: 'MLM & Mobile',
    description: 'Android app integrated with your website backend and APIs.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  },

  // NEW SERVICES
  {
    title: 'Trading Automation Bot',
    price: '$499 / ₹41,500',
    price_usd: 499,
    price_inr: 41500,
    commission: 20,
    rating: 4.8,
    category: 'AI & Automation',
    description: 'Automated trading bot with strategy execution, risk control, and alerts.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Lead Capture Chatbot',
    price: '$149 / ₹12,500',
    price_usd: 149,
    price_inr: 12500,
    commission: 20,
    rating: 4.8,
    category: 'AI & Automation',
    description: 'Website chatbot to capture leads, qualify users, and forward to CRM.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Crypto Airdrop Setup',
    price: '$399 / ₹33,000',
    price_usd: 399,
    price_inr: 33000,
    commission: 20,
    rating: 4.8,
    category: 'Crypto',
    description: 'Airdrop campaign setup with whitelisting, tracking, and anti-bot measures.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1640340434865-7341e5e88dfe?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Launchpad Setup (Presale Website Creation)',
    price: '$799 / ₹66,300',
    price_usd: 799,
    price_inr: 66300,
    commission: 20,
    rating: 4.8,
    category: 'Crypto',
    description: 'Presale website with wallet connect, whitelist, and progress tracking.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621509341960-6f5028a7891d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Portfolio Website for Freelancers',
    price: '$199 / ₹16,500',
    price_usd: 199,
    price_inr: 16500,
    commission: 20,
    rating: 4.8,
    category: 'Web Development',
    description: 'Fast personal portfolio with case studies, contact form, and blog.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Email Automation Setup (Mailchimp, SendGrid, etc.)',
    price: '$79 / ₹6,500',
    price_usd: 79,
    price_inr: 6500,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Connect provider, design templates, and build automated journeys.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Affiliate Program Creation System',
    price: '$599 / ₹49,900',
    price_usd: 599,
    price_inr: 49900,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'Set up multi-level affiliate program with payouts and referral links.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Lead Generation Service (Ad Campaign + Landing Page)',
    price: '$249 / ₹20,700',
    price_usd: 249,
    price_inr: 20700,
    commission: 20,
    rating: 4.8,
    category: 'Marketing',
    description: 'High-converting funnel: ad setup + optimized landing page + tracking.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'E-commerce Mobile App',
    price: '$1,199 / ₹99,000',
    price_usd: 1199,
    price_inr: 99000,
    commission: 20,
    rating: 4.8,
    category: 'MLM & Mobile',
    description: 'Shopping app with product catalog, cart, and checkout linked to store.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'AI Chat App (ChatGPT-style)',
    price: '$899 / ₹74,500',
    price_usd: 899,
    price_inr: 74500,
    commission: 20,
    rating: 4.8,
    category: 'AI & Automation',
    description: 'Chat application with conversation history, roles, and token usage limits.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508385082359-f38ae991e8f2?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Affiliate + Referral App System',
    price: '$1,499 / ₹124,000',
    price_usd: 1499,
    price_inr: 124000,
    commission: 20,
    rating: 4.8,
    category: 'MLM & Mobile',
    description: 'Mobile app for affiliates with referral links, dashboards, and payouts.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop',
  },
];

async function upsertServices() {
  const app = adminDb.app;
  console.log('[seed] Using project:', app?.options?.projectId || process.env.FIREBASE_PROJECT_ID || 'unknown');
  const colRef = adminDb.collection('services');

  const existing = await colRef.get();
  const existingById = new Map();
  existing.forEach((d) => existingById.set(d.id, d.ref));
  console.log('[seed] Existing docs:', existing.size);

  let creates = 0;
  let updates = 0;
  const desiredSlugs = new Set();
  for (const svc of services) {
    const slug = slugify(svc.title);
    desiredSlugs.add(slug);
    const now = new Date();

    const payload = {
      title: svc.title,
      description: svc.description,
      price: svc.price,
      price_usd: svc.price_usd,
      price_inr: svc.price_inr,
      commission: svc.commission,
      rating: svc.rating,
      category: svc.category,
      isActive: true,
      thumbnailUrl: svc.thumbnailUrl,
      formUrl: '',
      features: [],
      slug,
      updatedAt: now,
    };

    const byIdRef = existingById.get(slug);
    if (byIdRef) {
      console.log('[seed] update (by id) ->', slug);
      await byIdRef.set({ ...payload, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      updates++;
    } else {
      // Search by legacy slug field match
      let matchedRef = null;
      existing.forEach((d) => {
        if (!matchedRef) {
          const data = d.data();
          const legacySlug = data.slug || slugify(data.title || d.id);
          if (legacySlug === slug) matchedRef = d.ref;
        }
      });

      if (matchedRef) {
        console.log('[seed] update (legacy match) ->', slug);
        await matchedRef.set({ ...payload, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        updates++;
      } else {
        const docRef = colRef.doc(slug);
        console.log('[seed] create ->', slug, 'id:', docRef.id);
        await docRef.set({ ...payload, createdAt: now });
        creates++;
      }
    }
  }

  console.log('[seed] Desired slug count:', desiredSlugs.size);
  console.log('[seed] Completed. Creates:', creates, 'Updates:', updates);
}

upsertServices()
  .then(() => {
    console.log('Services upserted successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to upsert services:', err);
    process.exit(1);
  });


