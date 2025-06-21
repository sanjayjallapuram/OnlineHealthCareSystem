import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          // Store the complete user data
          setUser(response.data);
          // Update token if a new one is provided
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth validation error:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (userData) => {
    try {
      if (userData && userData.token) {
        localStorage.setItem('token', userData.token);
        setUser(userData);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      if (response.data) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data);
        setError(null);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const value = React.useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    checkAuth // Export checkAuth so it can be called after login/register
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 