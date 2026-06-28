import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount (if access token is present)
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/profile/me');
        setUser(response.data.profile);
      } catch (err) {
        console.warn('Session check failed or expired');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth expiration events from Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  // Register
  const register = async (fullName, email, password, role = 'researcher', additionalData = {}) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { 
        fullName, 
        email, 
        password, 
        role, 
        ...additionalData 
      });
      return { success: true, otpRequired: true, email };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, otpRequired } = response.data;
      
      if (otpRequired) {
        return { success: true, otpRequired: true, email, otpCode: response.data.otpCode };
      }
      
      localStorage.setItem('accessToken', accessToken);
      
      // Fetch full profile info
      const profileResponse = await api.get('/profile/me');
      setUser(profileResponse.data.profile);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed');
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      setLoading(false);
    }
  };

  // Sync profile data (used after scholar imports)
  const syncProfile = async () => {
    try {
      const profileResponse = await api.get('/profile/me');
      setUser(profileResponse.data.profile);
    } catch (err) {
      console.error('Profile sync failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, syncProfile }}>
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
