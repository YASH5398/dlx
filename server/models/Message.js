import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chat_id: { type: String, required: true },
  sender_type: { type: String, enum: ['user', 'agent', 'AI'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, default: () => Date.now() },
});

export default mongoose.model('Message', MessageSchema);