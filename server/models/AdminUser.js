import mongoose from 'mongoose';

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: '' },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'admin', enum: ['admin'] },
  is_active: { type: Boolean, default: true },
  last_login_at: { type: Date },
  promoted_from_user_id: { type: String }, // optional reference to existing user (e.g., Firebase uid)
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

AdminUserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('AdminUser', AdminUserSchema);