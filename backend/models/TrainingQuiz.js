import mongoose from 'mongoose';
const quizSchema = new mongoose.Schema({question:String,options:[String],correctAnswerIndex:Number,category:String,pointsValue:{type:Number,default:10}});
export default mongoose.model('TrainingQuiz',quizSchema);
