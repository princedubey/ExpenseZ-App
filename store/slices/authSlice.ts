import { AuthSlice, StoreSlice, AuthTokens, User } from '../types';
import api, { setTokenHandlers } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDENTIALS_KEY = '@auth_credentials';
const TOKENS_KEY = '@auth_tokens';

export const createAuthSlice: StoreSlice<AuthSlice> = (set, get) => {
  // Initialize API token handlers
  setTokenHandlers(
    () => get().tokens?.accessToken || undefined,
    () => get().refreshToken(),
    () => get().logout()
  );

  return {
  user: null,
  isAuthenticated: false,
    tokens: { accessToken: null, refreshToken: null },
    loading: false,
    error: null,

    login: async (email: string, password: string, rememberMe: boolean = true) => {
    try {
        set({ loading: true, error: null });
      const response = await api.post('/api/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
        
        // Save credentials and tokens if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
          await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }));
        } else {
          // Clear any stored credentials if remember me is unchecked
          await AsyncStorage.removeItem(CREDENTIALS_KEY);
          await AsyncStorage.removeItem(TOKENS_KEY);
        }
        
      set({ 
        user, 
        isAuthenticated: true,
          tokens: { accessToken, refreshToken },
          loading: false
      });
      } catch (error: any) {
      console.error('Login error:', error);
        set({ 
          loading: false, 
          error: error?.response?.data?.message || 'Login failed'
        });
      throw error;
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/api/auth/register', { email, password, name });
      const { user, accessToken, refreshToken } = response.data;
        
        // Save credentials and tokens
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
        await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }));
        
      set({ 
        user, 
        isAuthenticated: true,
        tokens: { accessToken, refreshToken }
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  loginWithGoogle: async (token: string) => {
    try {
      const response = await api.post('/api/auth/google', { idToken: token });
      const { user, accessToken, refreshToken } = response.data;
        
        // Save tokens
        await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }));
        
      set({ 
        user, 
        isAuthenticated: true,
        tokens: { accessToken, refreshToken }
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/api/auth/refresh-token');
      const { accessToken, refreshToken } = response.data;
        
        // Update tokens in storage
        await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }));
        
      set({ 
        tokens: { accessToken, refreshToken }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log the user out
        set({ user: null, isAuthenticated: false, tokens: { accessToken: null, refreshToken: null } });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
        // Clear stored credentials and tokens
        await AsyncStorage.removeItem(CREDENTIALS_KEY);
        await AsyncStorage.removeItem(TOKENS_KEY);
        set({ user: null, isAuthenticated: false, tokens: { accessToken: null, refreshToken: null } });
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      const user = response.data.user;
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Get current user error:', error);
      set({ user: null, isAuthenticated: false });
    }
  },

    loadStoredCredentials: async () => {
      try {
        const storedCredentials = await AsyncStorage.getItem(CREDENTIALS_KEY);
        const storedTokens = await AsyncStorage.getItem(TOKENS_KEY);
        
        if (storedCredentials && storedTokens) {
          const { email, password } = JSON.parse(storedCredentials);
          const { accessToken, refreshToken } = JSON.parse(storedTokens);
          
          // Set tokens
          set({ tokens: { accessToken, refreshToken } });
          
          // Try to get current user
          await get().getCurrentUser();
          
          return { email, password };
        }
        return null;
      } catch (error) {
        console.error('Load stored credentials error:', error);
        // Clear invalid stored credentials
        await AsyncStorage.removeItem(CREDENTIALS_KEY);
        await AsyncStorage.removeItem(TOKENS_KEY);
        return null;
      }
    },

    setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

    setTokens: (tokens: { accessToken: string | null; refreshToken: string | null }) => {
    set({ tokens });
  },
  };
}; 