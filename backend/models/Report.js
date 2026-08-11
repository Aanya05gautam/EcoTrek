import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: String,
  aiCategory: { 
    type: String, 
    enum: ['Wet/Organic', 'Dry/Recyclable', 'Hazardous', 'E-Waste', 'Unknown'], 
    default: 'Unknown' 
  },
  aiConfidence: { type: Number, default: 0 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  address: String,
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  }
}, { timestamps: true });

// Specific constraint requested by user: GeoJSON 2dsphere indexing for geolocation queries
reportSchema.index({ location: '2dsphere' });

export default mongoose.model('Report', reportSchema);
