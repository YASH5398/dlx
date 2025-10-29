import admin from 'firebase-admin';
import { firestore as adminFs } from '../firebaseAdmin.js';

const TARGETS = [
  { id: 'ai-chat-app-chatgpt-style', title: 'AI Chat App (ChatGPT-style)' },
  { id: 'portfolio-website-for-freelancers', title: 'Portfolio Website for Freelancers' },
  { id: 'business-website-setup', title: 'Business Website Setup' },
];

const indianNames = [
  'Amit Sharma','Neha Verma','Rahul Singh','Priya Iyer','Rohit Mehta','Kiran Desai','Sanjay Rao','Anita Kapoor','Sumit Sinha','Ritu Bansal',
  'Manish Gupta','Pooja Reddy','Arvind Nair','Divya Malhotra','Vikram Joshi','Sneha Kulkarni','Anand Mishra','Kavita Shah','Rakesh Yadav','Meera Chawla'
];

const longFeedbacks = [
  `The team at Digi Linex demonstrated a deep understanding of our requirements and translated them into a highly usable solution. Their communication was clear throughout the process. Delivery timelines were met without compromising on quality. We were able to go live faster than expected and the support was responsive post-deployment.`,
  `We had a great experience working with Digi Linex. The workflow was well-structured, and each milestone was delivered on schedule. The end result exceeded expectations in terms of performance and usability. Documentation and handover were handled professionally, making maintenance easy for our team.`,
  `Excellent execution from start to finish. The team proactively suggested improvements that added real value to the project. Testing was thorough and the final build was stable. We noticed immediate improvements in user engagement and overall customer satisfaction after launch.`,
  `Very professional and reliable. The project scope was managed efficiently, and feedback cycles were quick. The solution is scalable and integrates well with our existing systems. We appreciate the attention to detail and the level of polish that went into this delivery.`,
  `Top-notch quality and strong communication. The design choices were thoughtful and aligned with our brand. Performance is excellent, and the admin experience is smooth. The team was quick to address any questions and provided complete transparency at each step of the process.`,
  `Our collaboration with Digi Linex resulted in a robust product that our customers love. The deliverables were well tested, and the rollout was seamless. Post-launch monitoring and fixes were handled without delays. We look forward to working together on future enhancements.`
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedLong() {
  console.log('Seeding long realistic dummy reviews for 3 target services...');
  let total = 0;

  for (const svc of TARGETS) {
    const reviewsCol = adminFs.collection('services').doc(svc.id).collection('reviews');
    const toAdd = randInt(10, 30);
    const batch = adminFs.batch();

    for (let i = 0; i < toAdd; i++) {
      const reviewRef = reviewsCol.doc();
      const name = indianNames[randInt(0, indianNames.length - 1)];
      const rating = randInt(3, 5);
      // Compose 4–6 lines with random paragraphs combined
      const lines = randInt(4, 6);
      let text = '';
      for (let l = 0; l < lines; l++) {
        const part = longFeedbacks[randInt(0, longFeedbacks.length - 1)];
        text += (l > 0 ? '\n' : '') + part;
      }
      batch.set(reviewRef, {
        userId: 'dummyUser',
        userName: name,
        userEmail: 'dummy@example.com',
        rating,
        review: text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isDummy: true,
      });
    }

    await batch.commit();
    total += toAdd;
    const newCountSnap = await reviewsCol.get();
    console.log(`Seeded ${toAdd} long reviews for ${svc.title} (${svc.id}). Total now: ${newCountSnap.size}`);
  }
  console.log(`Done. Total long dummy reviews added: ${total}`);
}

seedLong().catch((e) => {
  console.error('Seeding long reviews failed:', e);
  process.exit(1);
});
