import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('MongoDB not configured. Using in-memory prototype store.');
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.warn('MongoDB unavailable. Falling back to in-memory store:', err.message);
    return false;
  }
}
