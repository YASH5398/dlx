import 'dotenv/config';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import AdminUser from '../models/AdminUser.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digilinex_support';

async function run() {
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const exists = await AdminUser.findOne({ email: email.toLowerCase() });
  if (exists) {
    console.log('Admin already exists:', email);
    await mongoose.disconnect();
    return;
  }
  const hash = await argon2.hash(password);
  const admin = await AdminUser.create({ email: email.toLowerCase(), password_hash: hash, name: 'Super Admin' });
  console.log('Seeded admin:', admin.email);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});