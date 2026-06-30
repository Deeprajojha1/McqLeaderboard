// src/models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email: { type: String, unique: true },
  // add any other profile fields, achievements, etc.
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
