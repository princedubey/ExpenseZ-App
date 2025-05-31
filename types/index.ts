export type UserType = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
};

export interface CategoryType {
  _id: string;
  name: string;
  color?: string;
}

export interface TransactionType {
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

export type BudgetType = {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
};

export type NotificationType = {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
};

export type ReportType = {
  id: string;
  title: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  totalIncome: number;
  totalExpense: number;
};