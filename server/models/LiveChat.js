import mongoose from 'mongoose';

const LiveChatSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  agent_id: { type: String, default: null },
  messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
  status: { type: String, enum: ['requested', 'active', 'declined', 'closed'], default: 'requested' },
  started_at: { type: Number, default: () => Date.now() },
});

export default mongoose.model('LiveChat', LiveChatSchema);