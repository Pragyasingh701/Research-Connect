import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Hook to handle Google Scholar Import operations
 */
export const useScholarImport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { syncProfile } = useAuth();

  const importProfile = async (authorId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/profile/google-scholar/import', { authorId });
      await syncProfile(); // Refresh context user profile data
      return { success: true, data: response.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to import Scholar profile';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return { importProfile, loading, error };
};

/**
 * Hook to handle profile text field updates
 */
export const useProfileUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { syncProfile } = useAuth();

  const update = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put('/profile', profileData);
      await syncProfile(); // Refresh context
      return { success: true, data: response.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};
