import { UserSlice, StoreSlice, User } from '../types';
import api from '../api';

export interface UserStats {
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  recentTransactions: Array<{
    _id: string;
    amount: number;
    type: 'income' | 'expense';
    note: string;
    date: string;
    category: string;
  }>;
  spendingByCategories: Array<{
    _id: string;
    name: string;
    total: number;
  }>;
  incomeByCategories: Array<{
    _id: string;
    name: string;
    total: number;
  }>;
}

export const createUserSlice: StoreSlice<UserSlice> = (set, get) => ({
  user: null,
  loading: false,
  error: null,
  analytics: null,

  setUser: (user) => {
    set({ user });
  },

  getUserAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/users/analytics');
      set({ analytics: response.data.data, loading: false });
      return response.data.data;
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to fetch analytics',
        loading: false 
      });
      throw error;
    }
  },

  updateUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/api/users/profile', data);
      set({ user: response.data.user, loading: false });
      return response.data.user;
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to update profile',
        loading: false 
      });
      throw error;
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      await api.put('/api/users/password', { currentPassword, newPassword });
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to update password',
        loading: false 
      });
      throw error;
    }
  },

  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      await api.delete('/api/users');
      set({ user: null, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to delete account',
        loading: false 
      });
      throw error;
    }
  },

  getUserStats: async () => {
    if (get().loading) {
      return get().stats;
    }

    try {
      set({ loading: true, error: null });
      const response = await api.get('/api/users/stats');
      const newStats = response.data.data;
      
      if (JSON.stringify(get().stats) !== JSON.stringify(newStats)) {
        set({ stats: newStats, loading: false });
      } else {
        set({ loading: false });
      }
      
      return newStats;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to fetch user stats';
      set({ 
        error: errorMessage,
        loading: false 
      });
      throw new Error(errorMessage);
    }
  },

  clearStats: () => {
    set({ stats: null, error: null });
  },
}); 