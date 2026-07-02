// src/controllers/authController.js
import User from '../models/userModel.js';
import redisClient from '../config/redis.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default {
  // POST /api/auth/signup
  async signup(req, res) {
    const { username, password, email } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: 'Username or email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        passwordHash,
        email,
        createdAt: new Date()
      });

      // Initialize user streak in Redis
      const streakKey = `streak:${user._id}`;
      await redisClient.set(streakKey, '1', { EX: 24 * 60 * 60 }); // 24 hours TTL

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(201).json({
        message: 'User created successfully',
        userId: user._id,
        username: user.username,
        token
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Signup failed' });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    const { email, password } = req.body;

    try {
      // Find user by username
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update daily streak in Redis
      const streakKey = `streak:${user._id}`;
      const currentStreak = await redisClient.get(streakKey);

      if (!currentStreak) {
        // First login or streak expired, start new streak
        await redisClient.set(streakKey, '1', { EX: 24 * 60 * 60 });
      } else {
        // Increment existing streak
        await redisClient.incr(streakKey);
        await redisClient.expire(streakKey, 24 * 60 * 60);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json({
        message: 'Login successful',
        userId: user._id,
        username: user.username,
        streak: currentStreak ? parseInt(currentStreak) + 1 : 1,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  },

  // POST /api/auth/logout
  async logout(req, res) {
    try {
      // Clear token cookie
      res.clearCookie('token');

      return res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  },

  // GET /api/auth/me
  async getProfile(req, res) {
    try {
      // Get userId from auth middleware
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await User.findById(userId).select('-passwordHash');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get streak from Redis
      const streakKey = `streak:${user._id}`;
      const streak = await redisClient.get(streakKey);

      return res.json({
        user,
        streak: streak ? parseInt(streak) : 0
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  // GET /api/auth/streak
  async getStreak(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const streakKey = `streak:${userId}`;
      const streak = await redisClient.get(streakKey);

      return res.json({
        streak: streak ? parseInt(streak) : 0
      });
    } catch (error) {
      console.error('Get streak error:', error);
      return res.status(500).json({ error: 'Failed to get streak' });
    }
  }
};
