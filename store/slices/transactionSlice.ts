import { TransactionSlice, StoreSlice, Transaction } from '../types';
import api from '../api';

export const createTransactionSlice: StoreSlice<TransactionSlice> = (set, get) => ({
  transactions: [],
  summary: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  },
  stats: null,

  setTransactions: (transactions: Transaction[]) => {
    set({ transactions });
  },

  getUserStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/transactions/stats');
      set({ stats: response.data, loading: false });
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || 'Failed to fetch stats' });
      throw error;
    }
  },

  fetchTransactions: async (params?: { 
    type?: 'income' | 'expense',
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string,
    category?: string
  }) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.type) queryParams.append('type', params.type);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.category) queryParams.append('category', params.category);

      const response = await api.get(`/api/transactions?${queryParams.toString()}`);
      const { data, currentPage, totalPages, total, limit } = response.data;
      
      set((state) => ({ 
        transactions: params?.page && params.page > 1 ? [...state.transactions, ...data] : data,
        pagination: {
          currentPage,
          totalPages,
          total,
          limit
        },
        loading: false 
      }));
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to fetch transactions',
        loading: false 
      });
      throw error;
    }
  },

  fetchTransactionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/transactions/${id}`);
      return response.data.data;
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to fetch transaction',
        loading: false 
      });
      throw error;
    }
  },

  addTransaction: async (transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/api/transactions', transaction);
      set((state) => ({
        transactions: [response.data, ...state.transactions],
        loading: false,
      }));
      // Refresh stats after adding transaction
      await get().getUserStats();
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || 'Failed to add transaction' });
      throw error;
    }
  },

  updateTransaction: async (id: string, transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/api/transactions/${id}`, transaction);
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t._id === id ? response.data : t
        ),
        loading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || 'Failed to update transaction' });
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/transactions/${id}`);
      set((state) => ({
        transactions: state.transactions.filter((t) => t._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to delete transaction',
        loading: false 
      });
      throw error;
    }
  },

  fetchTransactionSummary: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/transactions/summary');
      set({ summary: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.response?.data?.message || 'Failed to fetch summary',
        loading: false 
      });
      throw error;
    }
  },
}); 