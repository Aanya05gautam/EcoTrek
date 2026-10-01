import mongoose from 'mongoose';

const householdDisposalSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: String,
  category: { type: String, required: true },
  confidence: { type: Number, default: 0 },
  headline: { type: String, default: '' },
  guidance: { type: String, required: true },
  action: { type: String, required: true },
  reuseIdeas: { type: [String], default: [] },
  steps: { type: [String], default: [] },
  whyItMatters: { type: String, default: '' },
  safetyNote: { type: String, default: '' },
  aiProvider: { type: String, default: 'Keras local fallback' },
  status: { type: String, enum: ['Recorded'], default: 'Recorded' }
}, { timestamps: true });

export default mongoose.model('HouseholdDisposal', householdDisposalSchema);