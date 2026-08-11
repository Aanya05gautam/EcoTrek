import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name:{type:String,required:true}, email:{type:String,required:true,unique:true}, password:{type:String,required:true},
  role:{type:String,enum:['Citizen','Admin'],default:'Citizen'}, ecoPoints:{type:Number,default:0}, savedAddresses:[String]
},{timestamps:true});
export default mongoose.model('User',userSchema);
