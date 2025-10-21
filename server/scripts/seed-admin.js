import 'dotenv/config';

import argon2 from 'argon2';
import AdminUser from '../models/AdminUser.js';

async function run() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const exists = await AdminUser.findByEmail(email.toLowerCase());
  if (exists) {
    console.log('Admin already exists:', email);
    return;
  }
  const hash = await argon2.hash(password);
  const admin = await AdminUser.create({ email: email.toLowerCase(), password_hash: hash, name: 'Super Admin' });
  console.log('Seeded admin:', admin.email);
}

run().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});