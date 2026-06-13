import { TransactionSlice, StoreSlice, Transaction, TransactionSummary } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import seedData from '../ExpenseZ_Backup.json';

const LOCAL_TX_KEY = '@expensez_transactions';

const getStoredTransactions = async (): Promise<Transaction[]> => {
  const stored = await AsyncStorage.getItem(LOCAL_TX_KEY);
  if (!stored) {
    await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(seedData));
    return seedData as any[];
  }
  try {
    const allTx = JSON.parse(stored);
    if (!Array.isArray(allTx) || allTx.length === 0) {
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(seedData));
      return seedData as any[];
    }
    return allTx;
  } catch (e) {
    await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(seedData));
    return seedData as any[];
  }
};

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

  fetchTransactionSummary: async (forceRefresh = false) => {
    const hasCache = get().summary !== null;
    if (!hasCache || forceRefresh) {
      set({ loading: true, error: null });
    }

    const calculateSummary = async () => {
      const allTx = await getStoredTransactions();

      let cashIn = 0;
      let cashOut = 0;
      let investments = 0;
      let loans = 0;
      let investmentsFromBalance = 0;
      let loansFromBalance = 0;

      const categoryMap: { [key: string]: number } = {};

      allTx.forEach((t) => {
        const amt = t.amount || 0;
        if (t.type === 'cash_in') {
          cashIn += amt;
        } else if (t.type === 'cash_out') {
          cashOut += amt;
          categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
        } else if (t.type === 'investment') {
          if (!t.isBroken) {
            investments += amt;
          }
          if (t.source !== 'existing') {
            investmentsFromBalance += amt;
          }
        } else if (t.type === 'loan') {
          loans += amt;
          if (t.source !== 'existing') {
            loansFromBalance += amt;
          }
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
        savings: cashIn - cashOut - investmentsFromBalance - loansFromBalance,
        recentActivity,
        topCategories
      };

      set({ summary: computedSummary, loading: false });
    };

    try {
      if (hasCache && !forceRefresh) {
        calculateSummary().catch((err) => console.error('Failed to update summary in background:', err));
      } else {
        await calculateSummary();
      }
    } catch (error: any) {
      console.error('Failed to compute summary:', error);
      set({ loading: false, error: error?.message || 'Failed to compute summary' });
      throw error;
    }
  },

  getUserStats: async (forceRefresh = false) => {
    const hasCache = get().stats !== null;
    if (!hasCache || forceRefresh) {
      set({ loading: true, error: null });
    }

    const calculateStats = async () => {
      const allTx = await getStoredTransactions();

      let cashIn = 0;
      let cashOut = 0;
      let investments = 0;
      let loans = 0;
      let investmentsFromBalance = 0;
      let loansFromBalance = 0;

      const categoryMap: { [key: string]: number } = {};

      allTx.forEach((t) => {
        const amt = t.amount || 0;
        if (t.type === 'cash_in') {
          cashIn += amt;
        } else if (t.type === 'cash_out') {
          cashOut += amt;
          categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
        } else if (t.type === 'investment') {
          if (!t.isBroken) {
            investments += amt;
          }
          if (t.source !== 'existing') {
            investmentsFromBalance += amt;
          }
        } else if (t.type === 'loan') {
          loans += amt;
          if (t.source !== 'existing') {
            loansFromBalance += amt;
          }
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
        savings: cashIn - cashOut - investmentsFromBalance - loansFromBalance,
        recentActivity,
        topCategories
      };

      set({ stats: computedStats, loading: false });
      return computedStats;
    };

    try {
      if (hasCache && !forceRefresh) {
        calculateStats().catch((err) => console.error('Failed to update stats in background:', err));
        return get().stats!;
      } else {
        return await calculateStats();
      }
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
  }, forceRefresh = false) => {
    const hasCache = get().transactions.length > 0;
    if (!hasCache || forceRefresh) {
      set({ loading: true, error: null });
    }

    const loadAndSet = async () => {
      try {
        const allTx = await getStoredTransactions();
        
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

        const total = filtered.length;

        set({ 
          transactions: filtered,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            total,
            limit: total
          },
          loading: false 
        });
      } catch (error: any) {
        console.error('Failed to fetch local transactions:', error);
        set({ 
          error: error?.message || 'Failed to fetch transactions',
          loading: false 
        });
        throw error;
      }
    };

    if (hasCache && !forceRefresh) {
      loadAndSet();
    } else {
      await loadAndSet();
    }
  },

  fetchTransactionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const allTx = await getStoredTransactions();
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
      const allTx = await getStoredTransactions();
      
      let updatedList = [newTx, ...allTx];
      if (newTx.type === 'cash_in' && newTx.category === 'FD Break' && newTx.breakFdId) {
        updatedList = updatedList.map((t) => {
          if (t._id === newTx.breakFdId || t.id === newTx.breakFdId) {
            return {
              ...t,
              isBroken: true,
              isActive: false,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });
      }

      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updatedList));

      set({
        transactions: updatedList,
        loading: false
      });

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
      const allTx = await getStoredTransactions();
      
      const index = allTx.findIndex((t) => (t._id || t.id) === id);
      if (index === -1) {
        throw new Error('Transaction not found');
      }

      const oldTx = allTx[index];
      const updatedTx: Transaction = {
        ...oldTx,
        ...transaction,
        updatedAt: new Date().toISOString()
      };

      // Reset old linked FD
      if (oldTx.type === 'cash_in' && oldTx.category === 'FD Break' && oldTx.breakFdId) {
        allTx.forEach((t, i) => {
          if (t._id === oldTx.breakFdId || t.id === oldTx.breakFdId) {
            allTx[i] = {
              ...t,
              isBroken: false,
              isActive: true,
              updatedAt: new Date().toISOString()
            };
          }
        });
      }

      // Mark new linked FD
      if (updatedTx.type === 'cash_in' && updatedTx.category === 'FD Break' && updatedTx.breakFdId) {
        allTx.forEach((t, i) => {
          if (t._id === updatedTx.breakFdId || t.id === updatedTx.breakFdId) {
            allTx[i] = {
              ...t,
              isBroken: true,
              isActive: false,
              updatedAt: new Date().toISOString()
            };
          }
        });
      }

      allTx[index] = updatedTx;
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(allTx));

      set({
        transactions: allTx,
        loading: false
      });

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
      const allTx = await getStoredTransactions();
      const targetTx = allTx.find((t) => (t._id || t.id) === id);
      
      let filtered = allTx.filter((t) => (t._id || t.id) !== id);

      if (targetTx && targetTx.type === 'cash_in' && targetTx.category === 'FD Break' && targetTx.breakFdId) {
        filtered = filtered.map((t) => {
          if (t._id === targetTx.breakFdId || t.id === targetTx.breakFdId) {
            return {
              ...t,
              isBroken: false,
              isActive: true,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });
      }

      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(filtered));

      set({
        transactions: filtered,
        loading: false
      });

      await get().getUserStats();
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to delete transaction',
        loading: false
      });
      throw error;
    }
  },



  syncBackupData: async () => {
    set({ loading: true, error: null });
    try {
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(seedData));
      set({ transactions: seedData as any[] });
      await get().getUserStats();
      set({ loading: false });
    } catch (error: any) {
      console.error('Failed to sync backup data:', error);
      set({ error: error?.message || 'Failed to sync backup data', loading: false });
      throw error;
    }
  },
});