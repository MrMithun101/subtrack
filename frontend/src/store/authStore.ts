import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';
import { auth } from '../api/endpoints';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      return {
        // State - don't initialize from localStorage here, let persist middleware handle it
        // Then we'll validate in useAuth hook
        user: null,
        token: null,
        isLoading: false,
        error: null,

      // Actions
      setToken: (token: string) => {
        // Clean token before storing
        const cleanToken = token.trim();
        localStorage.setItem('access_token', cleanToken);
        set({ token: cleanToken });
        console.log('[AuthStore] Token stored - Length:', cleanToken.length, 'First 30:', cleanToken.substring(0, 30) + '...');
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await auth.login({ email, password });
          const token = response.access_token;
          
          // Store token
          get().setToken(token);
          
          // Load user data
          await get().loadUser();
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        try {
          await auth.register({
            email,
            password,
            full_name: fullName || null,
          });
          
          // After registration, automatically log in
          await get().login(email, password);
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          token: null,
          error: null,
        });
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ user: null, token: null, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null, token });
        try {
          const user = await auth.getMe();
          set({ user, token, isLoading: false });
        } catch (error: any) {
          // Token is invalid, clear everything
          get().logout();
          set({ error: null, isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
      };
    },
    {
      name: 'auth-storage',
      version: 1, // Increment version to clear old persisted data
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        // Don't persist isAuthenticated - it should be computed
      }),
      migrate: (persistedState: any) => {
        // Clear any old persisted isAuthenticated field
        if (persistedState && 'isAuthenticated' in persistedState) {
          delete persistedState.isAuthenticated;
        }
        return persistedState;
      },
    }
  )
);

export default useAuthStore;
