import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  chatId: { type: String, required: true },
  senderType: { type: String, enum: ['USER', 'AGENT', 'AI'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model('Message', messageSchema);