import { Schema, model } from 'mongoose';

const liveChatSchema = new Schema({
  userId: { type: String, required: true },
  agentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
});

export default model('LiveChat', liveChatSchema);