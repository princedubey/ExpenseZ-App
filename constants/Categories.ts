export const EXPENSE_CATEGORIES = {
  FOOD: 'Food & Dining',
  TRANSPORT: 'Transport',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  BILLS: 'Bills & Utilities',
  EMI: 'EMI',
  LOAN: 'Loan Repayment',
  HEALTH: 'Health & Medical',
  EDUCATION: 'Education',
  TRAVEL: 'Travel',
  GROCERIES: 'Groceries',
  RENT: 'Rent',
  SUBSCRIPTIONS: 'Subscriptions',
  INSURANCE: 'Insurance',
  PERSONAL_CARE: 'Personal Care',
  OTHERS: 'Others'
} as const;

export const INCOME_CATEGORIES = {
  SALARY: 'Salary',
  BUSINESS: 'Business',
  INVESTMENT: 'Investment',
  RENTAL: 'Rental Income',
  FREELANCE: 'Freelance',
  OTHERS: 'Others'
} as const;

export const INVESTMENT_CATEGORIES = {
  FD: 'FD',
  RD: 'RD',
  SIP: 'SIP',
  PPF: 'PPF',
  EPF: 'EPF',
  STOCK: 'Stock',
  MUTUAL_FUND: 'Mutual Fund',
  ETF: 'ETF',
  CRYPTO: 'Crypto',
  GOLD: 'Gold',
  REAL_ESTATE: 'Real Estate',
  OTHERS: 'Other',
} as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES];
export type IncomeCategory = typeof INCOME_CATEGORIES[keyof typeof INCOME_CATEGORIES];
export type InvestmentCategory = typeof INVESTMENT_CATEGORIES[keyof typeof INVESTMENT_CATEGORIES];

export const getCategoryColor = (category: string) => {
  switch (category) {
    case EXPENSE_CATEGORIES.FOOD:
      return '#FF6B6B';
    case EXPENSE_CATEGORIES.TRANSPORT:
      return '#4ECDC4';
    case EXPENSE_CATEGORIES.SHOPPING:
      return '#FFD93D';
    case EXPENSE_CATEGORIES.ENTERTAINMENT:
      return '#95E1D3';
    case EXPENSE_CATEGORIES.BILLS:
      return '#FF8B94';
    case EXPENSE_CATEGORIES.EMI:
      return '#6C5CE7';
    case EXPENSE_CATEGORIES.LOAN:
      return '#E056FD';
    case EXPENSE_CATEGORIES.HEALTH:
      return '#A8E6CF';
    case EXPENSE_CATEGORIES.EDUCATION:
      return '#FFB6B9';
    case EXPENSE_CATEGORIES.TRAVEL:
      return '#FFD3B6';
    case EXPENSE_CATEGORIES.GROCERIES:
      return '#FF8B94';
    case EXPENSE_CATEGORIES.RENT:
      return '#6C5CE7';
    case EXPENSE_CATEGORIES.SUBSCRIPTIONS:
      return '#F0932B';
    case EXPENSE_CATEGORIES.INSURANCE:
      return '#4834D4';
    case EXPENSE_CATEGORIES.PERSONAL_CARE:
      return '#FDA7DF';
    case EXPENSE_CATEGORIES.OTHERS:
      return '#95A5A6';
    case INCOME_CATEGORIES.SALARY:
      return '#2ECC71';
    case INCOME_CATEGORIES.BUSINESS:
      return '#3498DB';
    case INCOME_CATEGORIES.INVESTMENT:
      return '#9B59B6';
    case INCOME_CATEGORIES.RENTAL:
      return '#1ABC9C';
    case INCOME_CATEGORIES.FREELANCE:
      return '#F1C40F';
    case INCOME_CATEGORIES.OTHERS:
      return '#95A5A6';
    case INVESTMENT_CATEGORIES.FD:
      return '#8B5CF6';
    case INVESTMENT_CATEGORIES.RD:
      return '#6366F1';
    case INVESTMENT_CATEGORIES.SIP:
      return '#F472B6';
    case INVESTMENT_CATEGORIES.PPF:
      return '#3B82F6';
    case INVESTMENT_CATEGORIES.EPF:
      return '#0EA5E9';
    case INVESTMENT_CATEGORIES.STOCK:
      return '#10B981';
    case INVESTMENT_CATEGORIES.MUTUAL_FUND:
      return '#14B8A6';
    case INVESTMENT_CATEGORIES.ETF:
      return '#22C55E';
    case INVESTMENT_CATEGORIES.CRYPTO:
      return '#F59E0B';
    case INVESTMENT_CATEGORIES.GOLD:
      return '#D97706';
    case INVESTMENT_CATEGORIES.REAL_ESTATE:
      return '#6B7280';
    case INVESTMENT_CATEGORIES.OTHERS:
      return '#64748B';
    default:
      return '#95A5A6';
  }
}; 