import { AuthSlice, StoreSlice, User } from '../types';
import { setTokenHandlers } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@auth_user_session';

export const createAuthSlice: StoreSlice<AuthSlice> = (set, get) => {
  // Initialize API token handlers for compatibility
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
      throw new Error('Email/Password login is deprecated. Please use Google Sign-In or Continue as Guest.');
    },

    register: async (email: string, password: string, name: string) => {
      throw new Error('Registration is deprecated. Please use Google Sign-In or Continue as Guest.');
    },

    loginWithGoogle: async (idToken: string, userInfo?: any) => {
      try {
        set({ loading: true, error: null });

        const googleUser: User = {
          id: userInfo?.user?.id || `g_${Date.now()}`,
          name: userInfo?.user?.name || 'Google User',
          email: userInfo?.user?.email || 'user@gmail.com',
          profileImage: userInfo?.user?.photo || undefined,
          avatar: userInfo?.user?.photo || undefined,
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const session = {
          user: googleUser,
          type: 'google',
          idToken,
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

        set({
          user: googleUser,
          isAuthenticated: true,
          tokens: { accessToken: idToken, refreshToken: null },
          loading: false,
        });
      } catch (error: any) {
        console.error('Google login error:', error);
        set({
          loading: false,
          error: error?.message || 'Google login failed',
        });
        throw error;
      }
    },

    loginAsGuest: async (name: string = 'Guest') => {
      try {
        set({ loading: true, error: null });

        const guestUser: User = {
          id: `guest_${Date.now()}`,
          name: name || 'Guest User',
          email: 'guest@offline.local',
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const session = {
          user: guestUser,
          type: 'guest',
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

        set({
          user: guestUser,
          isAuthenticated: true,
          tokens: { accessToken: 'guest_token', refreshToken: null },
          loading: false,
        });
      } catch (error: any) {
        console.error('Guest login error:', error);
        set({
          loading: false,
          error: error?.message || 'Guest login failed',
        });
        throw error;
      }
    },

    refreshToken: async () => {
      // Client-only mode does not require backend JWT refresh tokens
    },

    logout: async () => {
      try {
        await AsyncStorage.removeItem(SESSION_KEY);
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          tokens: { accessToken: null, refreshToken: null },
        });
      }
    },

    getCurrentUser: async () => {
      // Managed through loadStoredCredentials on app bootstrap
    },

    loadStoredCredentials: async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const session = JSON.parse(storedSession);
          if (session.user) {
            set({
              user: session.user,
              isAuthenticated: true,
              tokens: {
                accessToken: session.idToken || 'guest_token',
                refreshToken: null,
              },
            });
            return { email: session.user.email, password: '' };
          }
        }
        return null;
      } catch (error) {
        console.error('Load stored session error:', error);
        await AsyncStorage.removeItem(SESSION_KEY);
        return null;
      }
    },

    setUser: (user: User | null) => {
      set({ user, isAuthenticated: !!user });
      if (user) {
        AsyncStorage.getItem(SESSION_KEY).then((stored) => {
          if (stored) {
            const session = JSON.parse(stored);
            session.user = user;
            AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
          }
        });
      }
    },

    setTokens: (tokens: { accessToken: string | null; refreshToken: string | null }) => {
      set({ tokens });
    },
  };
};