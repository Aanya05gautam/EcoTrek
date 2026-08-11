import TrainingQuiz from '../models/TrainingQuiz.js'; 
import User from '../models/User.js'; 
import { memoryStore } from '../services/store.js';

const mongo = () => TrainingQuiz.db?.readyState === 1;

export async function getQuiz(req, res) {
  if (mongo()) {
    // Aggressively flush and synchronize curriculum with active memoryStore for demo purposes
    await TrainingQuiz.deleteMany({});
    const q = await TrainingQuiz.insertMany(memoryStore.quizzes);
    return res.json(q);
  }
  res.json(memoryStore.quizzes);
}

export async function submitQuiz(req, res) {
  const { answers } = req.body;
  const qs = mongo() ? await TrainingQuiz.find() : memoryStore.quizzes;
  let score = 0;
  
  qs.forEach((q, i) => {
    if (answers?.[i] === q.correctAnswerIndex) score += q.pointsValue;
  });
  
  if (mongo()) {
    await User.findByIdAndUpdate(req.user.id, { $inc: { ecoPoints: score } });
  } else {
    const u = memoryStore.users.find(x => x.id === req.user.id);
    if (u) u.ecoPoints += score;
  }
  
  res.json({ score, ecoPointsEarned: score });
}
