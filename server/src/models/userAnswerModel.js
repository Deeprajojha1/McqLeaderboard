// src/models/userAnswerModel.js
import mongoose from 'mongoose';

const userAnswerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  answers: [{
    questionId: String,
    selectedAnswer: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days TTL
  }
});

// Compound index for efficient queries
userAnswerSchema.index({ userId: 1, state: 1, category: 1, difficulty: 1 });

export default mongoose.model('UserAnswer', userAnswerSchema);
