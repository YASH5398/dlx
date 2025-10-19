import { Schema, model } from 'mongoose';

const agentSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  assignedChats: [{ type: Schema.Types.ObjectId, ref: 'LiveChat' }],
});

export default model('Agent', agentSchema);