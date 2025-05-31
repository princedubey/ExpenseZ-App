export const EXPENSE_CATEGORIES = {
  FOOD: 'Food & Dining',
  TRANSPORT: 'Transport',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  BILLS: 'Bills & Utilities',
  EMI: 'EMI & Loans',
  HEALTH: 'Health & Medical',
  EDUCATION: 'Education',
  TRAVEL: 'Travel',
  GROCERIES: 'Groceries',
  RENT: 'Rent',
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

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES];
export type IncomeCategory = typeof INCOME_CATEGORIES[keyof typeof INCOME_CATEGORIES];

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
    default:
      return '#95A5A6';
  }
}; 