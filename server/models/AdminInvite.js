import mongoose from 'mongoose';

const AdminInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  used: { type: Boolean, default: false },
  used_at: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

AdminInviteSchema.index({ token: 1 }, { unique: true });

export default mongoose.model('AdminInvite', AdminInviteSchema);