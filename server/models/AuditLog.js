import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  action: { type: String, required: true },
  target_type: { type: String },
  target_id: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});

AuditLogSchema.index({ created_at: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);