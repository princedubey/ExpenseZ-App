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
      const response = await api.get('/api/dashboard');
      set({ stats: response.data.data, loading: false });
      return response.data.data;
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message || 'Failed to fetch stats' });
      throw error;
    }
  },

  fetchTransactions: async (params?: { 
    type?: 'cash_in' | 'cash_out' | 'investment' | 'loan',
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string,
    category?: string,
    month?: number,
    year?: number
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
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.year) queryParams.append('year', params.year.toString());

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
      set({ loading: false });
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
    // Optimistic create: insert a temporary transaction immediately,
    // replace with server result on success, remove on failure.
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempTransaction: Transaction = {
      _id: tempId,
      user: (get() as any).user || null,
      title: (transaction as any).title || transaction.note || transaction.category || 'New transaction',
      note: (transaction as any).note || '',
      category: (transaction as any).category || '',
      amount: (transaction as any).amount || 0,
      type: (transaction as any).type || 'cash_out',
      source: (transaction as any).source || 'balance',
      transactionDate: (transaction as any).transactionDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Transaction;

    // Add temp immediately
    set((state) => ({ transactions: [tempTransaction, ...state.transactions], error: null }));

    try {
      const response = await api.post('/api/transactions', transaction);
      const createdTransaction = response.data.data;

      // Replace temp with server-created transaction
      set((state) => ({
        transactions: state.transactions.map((t) => (t._id === tempId ? createdTransaction : t)),
      }));

      // Refresh stats after adding transaction
      await get().getUserStats();
      return createdTransaction;
    } catch (error: any) {
      // Remove the temp transaction on failure
      set((state) => ({
        transactions: state.transactions.filter((t) => t._id !== tempId),
        error: error?.response?.data?.message || 'Failed to add transaction',
      }));
      throw error;
    }
  },

  updateTransaction: async (id: string, transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => {
    // Optimistic update: apply patch locally, rollback on failure
    const prev = get().transactions.find((t) => (t.id || t._id) === id);
    if (!prev) throw new Error('Transaction not found');

    const optimistic: Transaction = { ...prev, ...transaction, updatedAt: new Date().toISOString() } as Transaction;

    // Apply optimistic update
    set((state) => ({ transactions: state.transactions.map((t) => ((t.id || t._id) === id ? optimistic : t)), error: null }));

    try {
      const response = await api.put(`/api/transactions/${id}`, transaction);
      const updatedTransaction = response.data.data;

      // Replace with authoritative server result
      set((state) => ({ transactions: state.transactions.map((t) => ((t.id || t._id) === id ? updatedTransaction : t)) }));
      return updatedTransaction;
    } catch (error: any) {
      // Rollback to previous state
      set((state) => ({ transactions: state.transactions.map((t) => ((t.id || t._id) === id ? prev : t)), error: error?.response?.data?.message || 'Failed to update transaction' }));
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    // Optimistic delete: remove locally first, restore on failure
    const current = get().transactions;
    const index = current.findIndex((t) => (t.id || t._id) === id);
    if (index === -1) throw new Error('Transaction not found');
    const removed = current[index];

    // Remove optimistically
    set((state) => ({ transactions: state.transactions.filter((t) => (t.id || t._id) !== id), error: null }));

    try {
      await api.delete(`/api/transactions/${id}`);
    } catch (error: any) {
      // Restore on failure
      set((state) => {
        const copy = [...state.transactions];
        copy.splice(index, 0, removed);
        return { transactions: copy, error: error?.response?.data?.message || 'Failed to delete transaction' };
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