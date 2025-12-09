import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export const useAuth = () => {
  // Subscribe to store fields
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const loadUser = useAuthStore((state) => state.loadUser);
  const clearError = useAuthStore((state) => state.clearError);

  // Load user on mount if token exists but user doesn't
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    console.log('[useAuth] Mount check:', { 
      storedToken: storedToken ? 'exists' : 'missing', 
      hasUser: !!user, 
      isLoading,
      storeToken: token ? 'exists' : 'missing'
    });
    
    if (storedToken && !user && !isLoading) {
      console.log('[useAuth] Loading user from token');
      loadUser();
    } else if (storedToken && !token) {
      // Token exists in localStorage but not in store - sync it
      console.log('[useAuth] Syncing token from localStorage to store');
      useAuthStore.getState().setToken(storedToken);
      if (!user) {
        loadUser();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Compute isAuthenticated from user and token
  const isAuthenticated = !!(user && token);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUser,
    clearError,
  };
};
