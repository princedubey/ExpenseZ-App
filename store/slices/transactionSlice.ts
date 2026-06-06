import { TransactionSlice, StoreSlice, Transaction, TransactionSummary } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_TX_KEY = '@expensez_transactions';

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
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];

      let cashIn = 0;
      let cashOut = 0;
      let investments = 0;
      let loans = 0;

      const categoryMap: { [key: string]: number } = {};

      allTx.forEach((t) => {
        const amt = t.amount || 0;
        if (t.type === 'cash_in') {
          cashIn += amt;
        } else if (t.type === 'cash_out') {
          cashOut += amt;
          categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
        } else if (t.type === 'investment') {
          investments += amt;
        } else if (t.type === 'loan') {
          loans += amt;
        }
      });

      const topCategories = Object.keys(categoryMap)
        .map((cat) => ({
          category: cat,
          total: categoryMap[cat]
        }))
        .sort((a, b) => b.total - a.total);

      const recentActivity = [...allTx]
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
        .slice(0, 10)
        .map((t) => ({
          id: t._id || t.id || '',
          title: t.title || t.note || 'Transaction',
          amount: t.amount || 0,
          type: t.type,
          category: t.category,
          transactionDate: t.transactionDate,
          createdAt: t.createdAt
        }));

      const computedStats = {
        cashIn,
        cashOut,
        investments,
        loans,
        savings: cashIn - cashOut,
        recentActivity,
        topCategories
      };

      set({ stats: computedStats, loading: false });
      return computedStats;
    } catch (error: any) {
      console.error('Failed to compute stats:', error);
      set({ loading: false, error: error?.message || 'Failed to compute stats' });
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
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];
      
      let filtered = [...allTx].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );

      if (params?.type) {
        filtered = filtered.filter((t) => t.type === params.type);
      }
      if (params?.category) {
        filtered = filtered.filter(
          (t) => t.category.toLowerCase() === params.category!.toLowerCase()
        );
      }
      if (params?.month !== undefined) {
        filtered = filtered.filter(
          (t) => new Date(t.transactionDate).getMonth() + 1 === params.month
        );
      }
      if (params?.year !== undefined) {
        filtered = filtered.filter(
          (t) => new Date(t.transactionDate).getFullYear() === params.year
        );
      }
      if (params?.startDate) {
        const start = new Date(params.startDate).getTime();
        filtered = filtered.filter((t) => new Date(t.transactionDate).getTime() >= start);
      }
      if (params?.endDate) {
        const end = new Date(params.endDate).getTime();
        filtered = filtered.filter((t) => new Date(t.transactionDate).getTime() <= end);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      
      const startIndex = (page - 1) * limit;
      const paginatedData = filtered.slice(startIndex, startIndex + limit);

      set((state) => ({ 
        transactions: page > 1 ? [...state.transactions, ...paginatedData] : paginatedData,
        pagination: {
          currentPage: page,
          totalPages,
          total,
          limit
        },
        loading: false 
      }));
    } catch (error: any) {
      console.error('Failed to fetch local transactions:', error);
      set({ 
        error: error?.message || 'Failed to fetch transactions',
        loading: false 
      });
      throw error;
    }
  },

  fetchTransactionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];
      const tx = allTx.find((t) => (t._id || t.id) === id);
      if (!tx) {
        throw new Error('Transaction not found');
      }
      set({ loading: false });
      return tx;
    } catch (error: any) {
      set({ 
        error: error?.message || 'Failed to fetch transaction',
        loading: false 
      });
      throw error;
    }
  },

  addTransaction: async (transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = (get() as any).user?.id || 'guest';
    const newTx: Transaction = {
      ...transaction,
      _id: id,
      id,
      user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Transaction;

    try {
      set({ loading: true, error: null });
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];
      
      const updatedList = [newTx, ...allTx];
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updatedList));

      set((state) => ({
        transactions: [newTx, ...state.transactions],
        loading: false
      }));

      await get().getUserStats();
      return newTx;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to add transaction',
        loading: false
      });
      throw error;
    }
  },

  updateTransaction: async (id: string, transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ loading: true, error: null });
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];
      
      const index = allTx.findIndex((t) => (t._id || t.id) === id);
      if (index === -1) {
        throw new Error('Transaction not found');
      }

      const updatedTx: Transaction = {
        ...allTx[index],
        ...transaction,
        updatedAt: new Date().toISOString()
      };

      allTx[index] = updatedTx;
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(allTx));

      set((state) => ({
        transactions: state.transactions.map((t) => ((t._id || t.id) === id ? updatedTx : t)),
        loading: false
      }));

      await get().getUserStats();
      return updatedTx;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to update transaction',
        loading: false
      });
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];
      
      const filtered = allTx.filter((t) => (t._id || t.id) !== id);
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(filtered));

      set((state) => ({
        transactions: state.transactions.filter((t) => (t._id || t.id) !== id),
        loading: false
      }));

      await get().getUserStats();
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to delete transaction',
        loading: false
      });
      throw error;
    }
  },

  fetchTransactionSummary: async () => {
    set({ loading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
      const allTx: Transaction[] = stored ? JSON.parse(stored) : [];

      let cashIn = 0;
      let cashOut = 0;
      let investments = 0;
      let loans = 0;

      const categoryMap: { [key: string]: number } = {};

      allTx.forEach((t) => {
        const amt = t.amount || 0;
        if (t.type === 'cash_in') {
          cashIn += amt;
        } else if (t.type === 'cash_out') {
          cashOut += amt;
          categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
        } else if (t.type === 'investment') {
          investments += amt;
        } else if (t.type === 'loan') {
          loans += amt;
        }
      });

      const topCategories = Object.keys(categoryMap)
        .map((cat) => ({
          category: cat,
          total: categoryMap[cat]
        }))
        .sort((a, b) => b.total - a.total);

      const recentActivity = [...allTx]
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
        .slice(0, 10)
        .map((t) => ({
          id: t._id || t.id || '',
          title: t.title || t.note || 'Transaction',
          amount: t.amount || 0,
          type: t.type,
          category: t.category,
          transactionDate: t.transactionDate,
          createdAt: t.createdAt
        }));

      const computedSummary: TransactionSummary = {
        cashIn,
        cashOut,
        investments,
        loans,
        savings: cashIn - cashOut,
        recentActivity,
        topCategories
      };

      set({ summary: computedSummary, loading: false });
    } catch (error: any) {
      console.error('Failed to compute summary:', error);
      set({ loading: false, error: error?.message || 'Failed to compute summary' });
      throw error;
    }
  },
});