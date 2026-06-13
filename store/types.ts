import { StateCreator } from 'zustand';
import { UserStats } from './slices/userSlice';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profileImage?: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreState extends AuthSlice, TransactionSlice, UserSlice, NewsSlice {
  // Add any additional state properties here
}

export type StoreSlice<T> = StateCreator<
  StoreState,
  [],
  [],
  T
>;

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string, userInfo?: any) => Promise<void>;
  loginAsGuest: (name?: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loadStoredCredentials: () => Promise<{ email: string; password: string } | null>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface UserSlice {
  user: User | null;
  loading: boolean;
  error: string | null;
  analytics: AnalyticsData | null;
  setUser: (user: User | null) => void;
  getUserAnalytics: (forceRefresh?: boolean) => Promise<AnalyticsData>;
  updateUser: (data: Partial<User>) => Promise<User>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Transaction {
  _id: string;
  id?: string;
  user: string;
  amount: number;
  type: 'cash_in' | 'cash_out' | 'investment' | 'loan';
  source?: 'balance' | 'existing';
  category: string;
  title: string;
  transactionDate: string;
  date?: string;
  note: string;
  isBroken?: boolean;
  isActive?: boolean;
  breakFdId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
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
  topCategories: {
    category: string;
    total: number;
  }[];
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface TransactionSlice {
  transactions: Transaction[];
  summary: TransactionSummary | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  stats: UserStats | null;
  setTransactions: (transactions: Transaction[]) => void;
  fetchTransactions: (params?: {
    type?: 'cash_in' | 'cash_out' | 'investment' | 'loan';
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
    month?: number;
    year?: number;
  }, forceRefresh?: boolean) => Promise<void>;
  fetchTransactionById: (id: string) => Promise<Transaction>;
  addTransaction: (transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchTransactionSummary: (forceRefresh?: boolean) => Promise<void>;
  getUserStats: (forceRefresh?: boolean) => Promise<UserStats>;
  syncBackupData: () => Promise<void>;
}

export interface AnalyticsData {
  month: number;
  year: number;
  monthlyStats: {
    month: string;
    income: number;
    expense: number;
    investments: number;
    investmentsFromBalance: number;
    loans: number;
    loansFromBalance: number;
    savings: number;
    balance: number;
  }[];
  spendingByCategories: {
    category: string;
    total: number;
  }[];
  currentMonthCategories: {
    category: string;
    total: number;
  }[];
  dayOfWeekStats: {
    day: string;
    total: number;
  }[];
  weeklyStats: {
    week: string;
    total: number;
  }[];
  topTransactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    totalInvestments: number;
    totalLoans: number;
    totalInvestmentsFromBalance: number;
    totalLoansFromBalance: number;
    netBalance: number;
    netSavings: number;
  };
}

export interface NewsSlice {
  news: any[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  setNews: (news: any[]) => void;
  fetchNews: (params?: { 
    page?: number;
    limit?: number;
    category?: string;
  }) => Promise<void>;
}