import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.user) {
          setUser(res.data.user);
          setStreak(res.data.streak || 0);
        }
      } catch (err) {
        console.log('No active session found.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to global unauthorized events (e.g. token expired)
    const handleUnauthorized = () => {
      setUser(null);
      setStreak(0);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data) {
        setUser({
          _id: res.data.userId,
          username: res.data.username,
          email: email
        });
        setStreak(res.data.streak || 1);
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const signup = async (username, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/signup', { username, email, password });
      if (res.data) {
        setUser({
          _id: res.data.userId,
          username: res.data.username,
          email: email
        });
        setStreak(1);
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setStreak(0);
    }
  };

  const refreshStreak = async () => {
    try {
      const res = await api.get('/auth/streak');
      if (res.data) {
        setStreak(res.data.streak || 0);
      }
    } catch (err) {
      console.error('Failed to refresh streak:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        streak,
        loading,
        error,
        login,
        signup,
        logout,
        refreshStreak,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
