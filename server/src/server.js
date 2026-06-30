// src/server.js
import 'dotenv/config';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';
import pubsub from './services/pubsubService.js';

// HTTP and Socket.IO setup
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

// Socket connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Allow client to subscribe to specific requestId
  socket.on('subscribeQuestion', (requestId) => {
    socket.join(`question:${requestId}`);
    console.log(`Socket ${socket.id} subscribed to question:${requestId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Subscribe to Redis channel for new quizzes
pubsub.subscribe('quiz:new', (data) => {
  io.emit('quizNew', data); // Emit to all clients
});

// Subscribe to Redis channel for question generation (worker notifications)
pubsub.subscribe('question:generated', (data) => {
  // Emit to specific room based on requestId
  io.to(`question:${data.requestId}`).emit('questionReady', data);
  console.log(`Question ready for requestId: ${data.requestId}`);
});

// Export io for use in controllers
global.io = io;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
