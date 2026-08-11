import mongoose from 'mongoose';
const pickupSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, wasteType:String, estimatedWeight:Number,address:String,
  slotDate:Date,status:{type:String,enum:['Requested','Assigned','Completed'],default:'Requested'}
},{timestamps:true});
export default mongoose.model('Pickup',pickupSchema);
