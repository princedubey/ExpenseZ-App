import { StateCreator } from 'zustand';
import { UserStats } from './slices/userSlice';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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
  getUserAnalytics: () => Promise<AnalyticsData>;
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
  user: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: {
    category: string;
    amount: number;
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
    type?: 'income' | 'expense';
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
  }) => Promise<void>;
  fetchTransactionById: (id: string) => Promise<Transaction>;
  addTransaction: (transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Omit<Transaction, '_id' | 'user' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchTransactionSummary: () => Promise<void>;
  getUserStats: () => Promise<UserStats>;
}

export interface AnalyticsData {
  monthlyStats: {
    month: string;
    income: number;
    expense: number;
    balance: number;
  }[];
  spendingByCategories: {
    category: string;
    total: number;
  }[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
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