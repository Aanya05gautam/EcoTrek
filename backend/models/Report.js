import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: String,
  aiCategory: {
  type: String,
  enum: [
    'Hazardous',
    'Non-Recyclable',
    'Organic',
    'Recyclable',
    'Wet/Organic',
    'Dry/Recyclable',
    'E-Waste',

    // Household model
    'cardboard',
    'glass',
    'metal',
    'paper',
    'plastic',
    'organic',
    'trash',

    // Outdoor model
    'normal',
    'overflowing',
    'mixed',
    'scattered',
    'organic_green',
    'hazardous',

    'Unknown'
  ],
  default: 'Unknown'
},

  aiConfidence: { type: Number, default: 0 },
  reportType: { type: String, enum: ['Household', 'Outdoor/Public'], default: 'Outdoor/Public' },
  quantity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  density: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  hazard: { type: String, enum: ['None', 'Possible', 'Confirmed'], default: 'None' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
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
