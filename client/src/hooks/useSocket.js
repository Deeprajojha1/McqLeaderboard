import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the origin, which will be proxied by Vite to http://localhost:3000
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Helper to subscribe to leaderboard events
  const subscribeToLeaderboard = (callback) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('scoreUpdated', callback);
    return () => {
      socket.off('scoreUpdated', callback);
    };
  };

  // Helper to subscribe to new quizzes
  const subscribeToNewQuizzes = (callback) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('quizNew', callback);
    return () => {
      socket.off('quizNew', callback);
    };
  };

  // Helper to subscribe to async question generation ready
  const subscribeToQuestionReady = (requestId, callback) => {
    const socket = socketRef.current;
    if (!socket) return;
    
    // Join the room for this request ID
    socket.emit('subscribeQuestion', requestId);
    
    socket.on('questionReady', (data) => {
      if (data.requestId === requestId) {
        callback(data);
      }
    });

    return () => {
      socket.off('questionReady');
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    subscribeToLeaderboard,
    subscribeToNewQuizzes,
    subscribeToQuestionReady
  };
};
