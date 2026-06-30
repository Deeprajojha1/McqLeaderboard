// src/models/questionModel.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  state: String,
  category: String,
  difficulty: String,
  questions: Array, // store generated Qs (or keep reference to cache key)
  generatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Question', questionSchema);
