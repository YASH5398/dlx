import { Schema, model } from 'mongoose';

const ticketSchema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Payment', 'Other'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  status: { type: String, enum: ['Open', 'Pending', 'Resolved'], default: 'Open' },
  createdAt: { type: Date, default: Date.now },
  updates: [{ date: Date, message: String, adminId: String }],
});

export default model('Ticket', ticketSchema);