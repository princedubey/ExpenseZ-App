import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, TrendingUp, TrendingDown, Receipt, PieChart as PieChartIcon, Wallet, ArrowDown, ArrowUp, ChevronRight } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import Avatar from '@/components/ui/Avatar';
import TransactionItem from '@/components/expenses/TransactionItem';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import type { StoreState } from '@/store/types';
import { getCategoryColor } from '@/constants/Categories';

interface RecentActivity {
  id: string;
  title: string;
  amount: number;
  type: 'cash_in' | 'cash_out' | 'investment' | 'loan';
  category: string;
  transactionDate: string;
  createdAt: string;
}

interface TopCategory {
  category: string;
  total: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  
  // Store selectors
  const stats = useStore((state: StoreState) => state.stats);
  const loading = useStore((state: StoreState) => state.loading);
  const error = useStore((state: StoreState) => state.error);
  const getUserStats = useStore((state: StoreState) => state.getUserStats);
  const user = useStore((state: StoreState) => state.user);

  const { showToast } = useToast();

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    try {
      await getUserStats();
    } catch (error: any) {
      showToast(error?.message || 'Failed to load stats', 'error');
    }
  }, [getUserStats, showToast]);

  // Refresh when focusing screen
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const navigateToAddTransaction = useCallback(() => {
    router.push('/(modals)/transactions/add');
  }, [router]);

  const navigateToSettings = useCallback(() => {
    router.push('/(tabs)/settings');
  }, [router]);

  const navigateToFilteredTransactions = useCallback((filter: string) => {
    router.push(`/(tabs)/transactions?filter=${filter}`);
  }, [router]);

  const viewAllTransactions = () => {
    router.push('/transactions');
  };

  const formattedDate = useMemo(() => {
    const currentDate = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return currentDate.toLocaleDateString('en-US', dateOptions).toUpperCase();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} colors={[colors.primary[600]]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.date, { color: colors.gray[400] }]}>{formattedDate}</Text>
            <Text style={[styles.greeting, { color: colors.light.text }]}>
              Hello, {user?.name?.split(' ')[0] || 'User'} 👋
            </Text>
          </View>
          <TouchableOpacity onPress={navigateToSettings} style={[styles.avatarWrapper, { borderColor: colors.primary[100] }]} activeOpacity={0.85}>
            <Avatar
              uri={user?.avatar}
              initials={user?.name?.charAt(0) || 'U'}
              size="md"
            />
          </TouchableOpacity>
        </View>
        
        {/* Premium Light Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.gray[400] }]}>LIQUID CASH BALANCE</Text>
              <Text style={[styles.balanceAmount, { color: colors.light.text }]}>
                {stats ? formatCurrency(stats.savings) : '₹0'}
              </Text>
            </View>
            <View style={[styles.balanceIconCircle, { backgroundColor: colors.primary[50] }]}>
              <Wallet size={20} color={colors.primary[600]} />
            </View>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: colors.light.border }]} />

          {/* Interactive Sub-metrics Grid */}
          <View style={styles.statsGrid}>
            {/* Row 1 */}
            <View style={styles.gridRow}>
              {/* Cash In */}
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigateToFilteredTransactions('cash_in')}
                activeOpacity={0.85}
              >
                <View style={styles.gridItemTopRow}>
                  <View style={[styles.gridIconCircle, { backgroundColor: colors.success[50] }]}>
                    <ArrowUp size={14} color={colors.success[600]} />
                  </View>
                  <Text style={[styles.gridItemLabel, { color: colors.gray[400] }]} numberOfLines={1}>CASH IN</Text>
                  <View style={{ flex: 1 }} />
                  <ChevronRight size={14} color={colors.gray[300]} />
                </View>
                <Text style={[styles.gridItemValue, { color: colors.success[600] }]} numberOfLines={1} adjustsFontSizeToFit>
                  {stats ? formatCurrency(stats.cashIn) : '₹0'}
                </Text>
              </TouchableOpacity>

              {/* Cash Out */}
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigateToFilteredTransactions('cash_out')}
                activeOpacity={0.85}
              >
                <View style={styles.gridItemTopRow}>
                  <View style={[styles.gridIconCircle, { backgroundColor: colors.error[50] }]}>
                    <ArrowDown size={14} color={colors.error[600]} />
                  </View>
                  <Text style={[styles.gridItemLabel, { color: colors.gray[400] }]} numberOfLines={1}>CASH OUT</Text>
                  <View style={{ flex: 1 }} />
                  <ChevronRight size={14} color={colors.gray[300]} />
                </View>
                <Text style={[styles.gridItemValue, { color: colors.error[600] }]} numberOfLines={1} adjustsFontSizeToFit>
                  {stats ? formatCurrency(stats.cashOut) : '₹0'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>
              {/* Investments */}
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigateToFilteredTransactions('investment')}
                activeOpacity={0.85}
              >
                <View style={styles.gridItemTopRow}>
                  <View style={[styles.gridIconCircle, { backgroundColor: colors.warning[50] }]}>
                    <TrendingUp size={14} color={colors.warning[600]} />
                  </View>
                  <Text style={[styles.gridItemLabel, { color: colors.gray[400] }]} numberOfLines={1}>INVESTMENTS</Text>
                  <View style={{ flex: 1 }} />
                  <ChevronRight size={14} color={colors.gray[300]} />
                </View>
                <Text style={[styles.gridItemValue, { color: colors.warning[600] }]} numberOfLines={1} adjustsFontSizeToFit>
                  {stats ? formatCurrency(stats.investments) : '₹0'}
                </Text>
              </TouchableOpacity>

              {/* Loans */}
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigateToFilteredTransactions('loan')}
                activeOpacity={0.85}
              >
                <View style={styles.gridItemTopRow}>
                  <View style={[styles.gridIconCircle, { backgroundColor: colors.accent[50] }]}>
                    <Wallet size={14} color={colors.accent[600]} />
                  </View>
                  <Text style={[styles.gridItemLabel, { color: colors.gray[400] }]} numberOfLines={1}>LOANS & EMI</Text>
                  <View style={{ flex: 1 }} />
                  <ChevronRight size={14} color={colors.gray[300]} />
                </View>
                <Text style={[styles.gridItemValue, { color: colors.accent[600] }]} numberOfLines={1} adjustsFontSizeToFit>
                  {stats ? formatCurrency(stats.loans || 0) : '₹0'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.light.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={viewAllTransactions} style={styles.viewAllRow} activeOpacity={0.7}>
              <Text style={[styles.viewAllText, { color: colors.primary[600] }]}>
                View All
              </Text>
              <ChevronRight size={14} color={colors.primary[600]} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.sectionCardList, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            {stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((transaction: RecentActivity) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={{
                    ...transaction,
                    _id: transaction.id,
                    note: transaction.title || '',
                  } as any}
                  onPress={(item) => router.push(`/(modals)/transactions/add?id=${item.id || item._id}`)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary[50] }]}>
                  <Receipt size={24} color={colors.primary[600]} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.light.text }]}>No Recent Transactions</Text>
                <Text style={[styles.emptyDescription, { color: colors.gray[400] }]}>
                  Start tracking your expenses by adding your first transaction.
                </Text>
              </View>
            )}
          </View>
        </View>
          
        {/* Spending by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.light.text, marginBottom: Metrics.md }]}>
            Spending breakdown
          </Text>
          {stats && stats.topCategories && stats.topCategories.length > 0 ? (
            <View style={styles.spendingContainer}>
              {stats.topCategories.map((category: TopCategory) => {
                const totalOutflow = stats?.cashOut || 1;
                const percentage = Math.round((category.total / totalOutflow) * 100);
                const catColor = getCategoryColor(category.category);
                
                return (
                  <View
                    key={category.category}
                    style={[styles.categoryProgressCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}
                  >
                    <View style={styles.categoryHeaderRow}>
                      <View style={styles.categoryInfo}>
                        <View style={[styles.categoryIconCircle, { backgroundColor: catColor + '15' }]}>
                          <TrendingDown size={14} color={catColor} />
                        </View>
                        <View>
                          <Text style={[styles.categoryNameText, { color: colors.light.text }]}>
                            {category.category}
                          </Text>
                          <Text style={[styles.categoryPercentageText, { color: colors.gray[400] }]}>
                            {percentage}% of cash out
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.categoryAmountText, { color: colors.light.text }]}>
                        {formatCurrency(category.total)}
                      </Text>
                    </View>
                    
                    {/* Thin Progress Bar */}
                    <View style={[styles.progressBarTrack, { backgroundColor: colors.light.background }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${Math.min(100, Math.max(0, percentage))}%`, 
                            backgroundColor: catColor 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary[50] }]}>
                <PieChartIcon size={24} color={colors.primary[600]} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.light.text }]}>No Spending Categories</Text>
              <Text style={[styles.emptyDescription, { color: colors.gray[400] }]}>
                Add transactions to see your spending breakdown by category.
              </Text>
            </View>
          )}
        </View>

        {/* Income by Category Highlights */}
        <View style={[styles.section, { paddingBottom: Metrics.xxl + 40 }]}>
          <Text style={[styles.sectionTitle, { color: colors.light.text, marginBottom: Metrics.md }]}>
            Cash In Highlights
          </Text>
          {stats && stats.recentActivity && stats.recentActivity.filter((item: RecentActivity) => item.type === 'cash_in').length > 0 ? (
            <View style={styles.cashInGrid}>
              {stats.recentActivity
                .filter((item: RecentActivity) => item.type === 'cash_in')
                .slice(0, 5)
                .map((transaction: RecentActivity) => {
                  const catColor = getCategoryColor(transaction.category);
                  return (
                    <View
                      key={transaction.id}
                      style={[styles.cashInCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}
                    >
                      <View style={styles.cashInInfo}>
                        <View style={[styles.cashInIconCircle, { backgroundColor: catColor + '15' }]}>
                          <TrendingUp size={14} color={catColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cashInTitle, { color: colors.light.text }]} numberOfLines={1}>
                            {transaction.title || transaction.category || 'Income'}
                          </Text>
                          <Text style={[styles.cashInMeta, { color: colors.gray[400] }]}>
                            {transaction.category} • {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.cashInAmount, { color: colors.success[600] }]}>
                        +{formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  );
                })}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary[50] }]}>
                <Wallet size={24} color={colors.primary[600]} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.light.text }]}>No Cash In Activity</Text>
              <Text style={[styles.emptyDescription, { color: colors.gray[400] }]}>
                Add cash in transactions to see your earnings breakdown.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary[600] }]}
        onPress={navigateToAddTransaction}
        activeOpacity={0.9}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Metrics.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Metrics.lg,
    paddingTop: Metrics.lg,
    paddingBottom: Metrics.md,
  },
  greeting: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl + 2,
    marginTop: 2,
  },
  date: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  avatarWrapper: {
    borderWidth: 1.5,
    borderRadius: Metrics.borderRadius.full,
    padding: 2,
  },
  balanceCard: {
    marginHorizontal: Metrics.lg,
    marginVertical: Metrics.sm,
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.title + 2,
    letterSpacing: -0.5,
  },
  balanceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    height: 1,
    marginVertical: Metrics.md,
  },
  statsGrid: {
    gap: Metrics.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Metrics.sm,
  },
  gridItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: Metrics.xs,
    paddingHorizontal: 4,
    borderWidth: 0,
    overflow: 'hidden',
  },
  gridItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  gridIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gridItemText: {
    flex: 1,
    justifyContent: 'center',
  },
  gridItemLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  gridItemValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.lg,
    width: '100%',
  },
  section: {
    paddingHorizontal: Metrics.lg,
    paddingTop: Metrics.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.lg,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  sectionCardList: {
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.xl,
    overflow: 'hidden',
  },
  spendingContainer: {
    gap: Metrics.sm,
  },
  categoryProgressCard: {
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.xl,
    padding: Metrics.md,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryNameText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  categoryPercentageText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 1,
  },
  categoryAmountText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cashInGrid: {
    gap: Metrics.sm,
  },
  cashInCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Metrics.md,
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.xl,
  },
  cashInInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  cashInIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashInTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  cashInMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 1,
  },
  cashInAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm + 1,
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
    elevation: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  emptyContainer: {
    paddingVertical: Metrics.xl * 1.5,
    paddingHorizontal: Metrics.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Metrics.md,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md + 1,
    marginBottom: 4,
  },
  emptyDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
});