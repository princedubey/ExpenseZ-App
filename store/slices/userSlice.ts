import { UserSlice, StoreSlice, User, AnalyticsData, Transaction } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@auth_user_session';

export interface UserStats {
  cashIn: number;
  cashOut: number;
  investments: number;
  loans?: number;
  savings: number;
  recentActivity: Array<{
    id: string;
    title: string;
    amount: number;
    type: 'cash_in' | 'cash_out' | 'investment' | 'loan';
    category: string;
    transactionDate: string;
    createdAt: string;
  }>;
  topCategories: Array<{
    category: string;
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

  getUserAnalytics: async (forceRefresh = false): Promise<AnalyticsData> => {
    const hasCache = get().analytics !== null;
    if (!hasCache || forceRefresh) {
      set({ loading: true, error: null });
    }
    try {
      let transactions = (get() as any).transactions || [];
      if (transactions.length === 0) {
        if ((get() as any).fetchTransactions) {
          await (get() as any).fetchTransactions();
          transactions = (get() as any).transactions || [];
        }
      }
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // 1. Generate local monthly stats for the last 6 months
      const monthlyStats: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('en-US', { month: 'short' });
        monthlyStats.push({
          month: monthLabel,
          year: d.getFullYear(),
          monthNum: d.getMonth(),
          income: 0,
          expense: 0,
          investments: 0,
          investmentsFromBalance: 0,
          loans: 0,
          loansFromBalance: 0,
          savings: 0,
          balance: 0,
        });
      }

      // 2. Spending by category overall & current month
      const categoryMapOverall: { [key: string]: number } = {};
      const categoryMapCurrentMonth: { [key: string]: number } = {};
      
      // 3. Day of week stats (Sun-Sat) for current month
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayMap: { [key: string]: number } = {};
      days.forEach(d => { dayMap[d] = 0; });

      // 4. Weekly stats (Week 1 to Week 5) for current month
      const weekMap: { [key: string]: number } = {
        'Week 1': 0,
        'Week 2': 0,
        'Week 3': 0,
        'Week 4': 0,
        'Week 5': 0,
      };

      // Summary totals
      let totalIncome = 0;
      let totalExpense = 0;
      let totalInvestments = 0;
      let totalLoans = 0;
      let totalInvestmentsFromBalance = 0;
      let totalLoansFromBalance = 0;

      transactions.forEach((t: Transaction) => {
        const tDate = new Date(t.transactionDate);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        const amt = t.amount || 0;

        // Process monthly stats matching last 6 months range
        monthlyStats.forEach(m => {
          if (m.monthNum === tMonth && m.year === tYear) {
            if (t.type === 'cash_in') m.income += amt;
            else if (t.type === 'cash_out') m.expense += amt;
            else if (t.type === 'investment') {
              if (!t.isBroken) m.investments += amt;
              if (t.source !== 'existing') m.investmentsFromBalance += amt;
            } else if (t.type === 'loan') {
              m.loans += amt;
              if (t.source !== 'existing') m.loansFromBalance += amt;
            }
          }
        });

        // Sum overall totals
        if (t.type === 'cash_in') {
          totalIncome += amt;
        } else if (t.type === 'cash_out') {
          totalExpense += amt;
          categoryMapOverall[t.category] = (categoryMapOverall[t.category] || 0) + amt;
        } else if (t.type === 'investment') {
          if (!t.isBroken) {
            totalInvestments += amt;
          }
          if (t.source !== 'existing') {
            totalInvestmentsFromBalance += amt;
          }
        } else if (t.type === 'loan') {
          totalLoans += amt;
          if (t.source !== 'existing') totalLoansFromBalance += amt;
        }

        // Process current month stats specifically
        if (tMonth === currentMonth && tYear === currentYear) {
          if (t.type === 'cash_out') {
            categoryMapCurrentMonth[t.category] = (categoryMapCurrentMonth[t.category] || 0) + amt;
            
            // Day of week
            const dayLabel = days[tDate.getDay()];
            dayMap[dayLabel] = (dayMap[dayLabel] || 0) + amt;

            // Week of month
            const dayOfMonth = tDate.getDate();
            let weekLabel = 'Week 5';
            if (dayOfMonth <= 7) weekLabel = 'Week 1';
            else if (dayOfMonth <= 14) weekLabel = 'Week 2';
            else if (dayOfMonth <= 21) weekLabel = 'Week 3';
            else if (dayOfMonth <= 28) weekLabel = 'Week 4';
            weekMap[weekLabel] += amt;
          }
        }
      });

      // Calculate balance & savings for each month in monthlyStats
      monthlyStats.forEach(m => {
        m.balance = m.income - m.expense - m.investmentsFromBalance - m.loansFromBalance;
        m.savings = m.income - m.expense;
      });

      // Sort category lists
      const spendingByCategories = Object.keys(categoryMapOverall).map(cat => ({
        category: cat,
        total: categoryMapOverall[cat],
      })).sort((a, b) => b.total - a.total);

      const currentMonthCategories = Object.keys(categoryMapCurrentMonth).map(cat => ({
        category: cat,
        total: categoryMapCurrentMonth[cat],
      })).sort((a, b) => b.total - a.total);

      const dayOfWeekStats = Object.keys(dayMap).map(d => ({
        day: d,
        total: dayMap[d],
      }));

      const weeklyStats = Object.keys(weekMap).map(w => ({
        week: w,
        total: weekMap[w],
      }));

      // Top 5 highest transactions
      const topTransactions = [...transactions]
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5);

      const netBalance = totalIncome - totalExpense - totalInvestmentsFromBalance - totalLoansFromBalance;
      const netSavings = totalIncome - totalExpense;

      const analyticsData: AnalyticsData = {
        month: currentMonth + 1,
        year: currentYear,
        monthlyStats,
        spendingByCategories,
        currentMonthCategories,
        dayOfWeekStats,
        weeklyStats,
        topTransactions,
        summary: {
          totalIncome,
          totalExpense,
          totalInvestments,
          totalLoans,
          totalInvestmentsFromBalance,
          totalLoansFromBalance,
          netBalance,
          netSavings,
        },
      };

      set({ analytics: analyticsData, loading: false });
      return analyticsData;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to compute analytics',
        loading: false,
      });
      throw error;
    }
  },

  updateUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const storeUser = (get() as any).user;
      if (!storeUser) {
        throw new Error('No active user session');
      }

      const updatedUser: User = {
        ...storeUser,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      // Save updated user to state and async storage session
      set({ user: updatedUser, loading: false });

      const storedSession = await AsyncStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const session = JSON.parse(storedSession);
        session.user = updatedUser;
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }

      return updatedUser;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to update user profile',
        loading: false,
      });
      throw error;
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    // Passwords do not exist in guest/Google scopes, return success silently.
    return Promise.resolve();
  },

  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      // Clear all related AsyncStorage keys
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem('@expensez_transactions');
      
      // Reset the main application store
      const store = get() as any;
      if (store.logout) {
        await store.logout();
      }

      set({ user: null, analytics: null, loading: false });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to reset account',
        loading: false,
      });
      throw error;
    }
  },
});