import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, TrendingUp, TrendingDown, Receipt, PieChart as PieChartIcon, Wallet } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import PieChart from '@/components/charts/PieChart';
import TransactionItem from '@/components/expenses/TransactionItem';
import Button from '@/components/ui/Button';
import { TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { shallow } from 'zustand/shallow';
import type { StoreState } from '@/store/types';
import { getCategoryColor } from '@/constants/Categories';

interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note: string;
  category: string;
}

interface Category {
  _id: string;
  name: string;
  total: number;
}

const EmptyStateCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onPress 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  onPress?: () => void;
}) => {
  const colors = useColors();
  
  return (
    <TouchableOpacity 
      style={[styles.emptyStateCard, { backgroundColor: colors.light.card }]}
      onPress={onPress}
    >
      <View style={[styles.emptyStateIcon, { backgroundColor: colors.primary[50] }]}>
        <Icon size={Metrics.iconSize.xl} color={colors.primary[600]} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: colors.light.text }]}>{title}</Text>
      <Text style={[styles.emptyStateDescription, { color: colors.gray[500] }]}>{description}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  
  // Memoize the store selectors
  const stats = useStore((state: StoreState) => state.stats);
  const loading = useStore((state: StoreState) => state.loading);
  const error = useStore((state: StoreState) => state.error);
  const getUserStats = useStore((state: StoreState) => state.getUserStats);
  const user = useStore((state: StoreState) => state.user);

  const { showToast } = useToast();

  // Memoize the loadStats function
  const loadStats = useCallback(async () => {
    try {
      await getUserStats();
    } catch (error: any) {
      showToast(error?.message || 'Failed to load stats', 'error');
    }
  }, [getUserStats, showToast]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  // Memoize the formatCurrency function
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Memoize the navigation functions
  const navigateToAddTransaction = useCallback(() => {
    router.push('/(modals)/transactions/add');
  }, [router]);

  const navigateToSettings = useCallback(() => {
    router.push('/(tabs)/settings');
  }, [router]);

  // Memoize the current date
  const formattedDate = useMemo(() => {
    const currentDate = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return currentDate.toLocaleDateString('en-US', dateOptions);
  }, []);

  const pieChartData = [
    {
      name: 'Groceries',
      value: 4500,
      color: colors.primary[500],
    },
    {
      name: 'Dining',
      value: 3200,
      color: colors.secondary[500],
    },
    {
      name: 'Transport',
      value: 2800,
      color: colors.warning[500],
    },
    {
      name: 'Entertainment',
      value: 1500,
      color: colors.accent[500],
    },
    {
      name: 'Shopping',
      value: 2000,
      color: colors.error[500],
    },
  ];
  
  const viewAllTransactions = () => {
    router.push('/transactions');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} colors={[colors.primary[600]]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.light.text }]}>
              Hello, {user?.name?.split(' ')[0] || 'User'}
            </Text>
            <Text style={[styles.date, { color: colors.gray[500] }]}>{formattedDate}</Text>
          </View>
          <TouchableOpacity onPress={navigateToSettings}>
          <Avatar
              uri={user?.avatar}
              initials={user?.name?.charAt(0) || 'U'}
            size="md"
          />
          </TouchableOpacity>
        </View>
        
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.light.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.gray[600] }]}>
            Total Balance
          </Text>
          <Text style={[styles.balanceAmount, { color: colors.light.text }]}>
            {stats ? formatCurrency(stats.totals.balance) : '₹0'}
                  </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
                <ArrowUp size={Metrics.iconSize.sm} color={colors.success[600]} />
              </View>
              <View>
                <Text style={[styles.statLabel, { color: colors.gray[600] }]}>
                  Income
                </Text>
                <Text style={[styles.statAmount, { color: colors.success[600] }]}>
                  {stats ? formatCurrency(stats.totals.income) : '₹0'}
                  </Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.error[50] }]}>
                <ArrowDown size={Metrics.iconSize.sm} color={colors.error[600]} />
              </View>
              <View>
                <Text style={[styles.statLabel, { color: colors.gray[600] }]}>
                  Expense
                </Text>
                <Text style={[styles.statAmount, { color: colors.error[600] }]}>
                  {stats ? formatCurrency(stats.totals.expense) : '₹0'}
              </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.light.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={viewAllTransactions}>
              <Text style={[styles.viewAllText, { color: colors.primary[600] }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {stats && stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.map((transaction: Transaction) => (
              <View
                key={transaction._id}
                style={[styles.transactionItem, { backgroundColor: colors.light.card }]}
              >
                <View style={styles.transactionInfo}>
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionTitle, { color: colors.light.text }]}>
                      {transaction.note || transaction.category || 'No description'}
                    </Text>
                  </View>
                  <Text style={[styles.transactionDate, { color: colors.gray[500] }]}>
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === 'income'
                          ? colors.success[600]
                          : colors.error[600],
                    },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <EmptyStateCard
              icon={Receipt}
              title="No Recent Transactions"
              description="Start tracking your expenses by adding your first transaction"
              onPress={navigateToAddTransaction}
            />
          )}
          </View>
          
        {/* Spending by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.light.text }]}>
            Spending by Category
          </Text>
          {stats && stats.spendingByCategories && stats.spendingByCategories.length > 0 ? (
            stats.spendingByCategories.map((category: Category) => (
              <View
                key={category._id}
                style={[styles.categoryItem, { backgroundColor: colors.light.card }]}
              >
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: getCategoryColor(category.name) + '20' },
                    ]}
                  >
                    <TrendingDown size={Metrics.iconSize.sm} color={getCategoryColor(category.name)} />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.light.text }]}>
                    {category.name}
                  </Text>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.error[600] }]}>
                  {formatCurrency(category.total)}
                </Text>
              </View>
            ))
          ) : (
            <EmptyStateCard
              icon={PieChartIcon}
              title="No Spending Categories"
              description="Add transactions to see your spending breakdown by category"
              onPress={navigateToAddTransaction}
            />
          )}
        </View>

        {/* Income by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.light.text }]}>
            Income by Category
          </Text>
          {stats && stats.incomeByCategories && stats.incomeByCategories.length > 0 ? (
            stats.incomeByCategories.map((category: Category) => (
              <View
                key={category._id}
                style={[styles.categoryItem, { backgroundColor: colors.light.card }]}
              >
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: getCategoryColor(category.name) + '20' },
                    ]}
                  >
                    <TrendingUp size={Metrics.iconSize.sm} color={getCategoryColor(category.name)} />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.light.text }]}>
                    {category.name}
                  </Text>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.success[600] }]}>
                  {formatCurrency(category.total)}
                </Text>
              </View>
            ))
          ) : (
            <EmptyStateCard
              icon={Wallet}
              title="No Income Categories"
              description="Add income transactions to see your earnings breakdown"
              onPress={navigateToAddTransaction}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary[600] }]}
        onPress={navigateToAddTransaction}
      >
        <Plus size={24} color={colors.light.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Metrics.md,
    paddingTop: Metrics.lg,
    paddingBottom: Metrics.md,
  },
  greeting: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
    marginBottom: Metrics.xs / 2,
  },
  date: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
  },
  balanceCard: {
    margin: Metrics.md,
    padding: Metrics.lg,
    borderRadius: Metrics.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
    marginBottom: Metrics.xs,
  },
  balanceAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.title,
    marginBottom: Metrics.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Metrics.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Metrics.sm,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  statAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
  section: {
    padding: Metrics.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.lg,
  },
  viewAllText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.md,
    marginBottom: Metrics.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrics.xs,
  },
  transactionTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  transactionDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
  },
  transactionAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.md,
    marginBottom: Metrics.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: Metrics.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Metrics.sm,
  },
  categoryName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  categoryAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
  fab: {
    position: 'absolute',
    bottom: Metrics.tabBarHeight + Metrics.xl,
    right: Metrics.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emptyStateCard: {
    padding: Metrics.xl,
    borderRadius: Metrics.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  emptyStateTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.lg,
    marginBottom: Metrics.xs,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
    marginBottom: Metrics.md,
  },
});