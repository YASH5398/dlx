import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  subject: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Assigned', 'Closed'], default: 'Pending' },
  assign_to: { type: String, default: null },
  file_path: { type: String },
  created_at: { type: Number, default: () => Date.now() },
});

export default mongoose.model('Ticket', TicketSchema);