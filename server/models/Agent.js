import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema({
  available: { type: Boolean, default: false },
});

export default mongoose.model('Agent', AgentSchema);