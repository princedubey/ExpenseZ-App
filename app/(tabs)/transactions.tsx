import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { TransactionsList } from '@/components/expenses/TransactionsList';
import type { StoreState } from '@/store/types';
import type { TransactionType } from '@/types';
import { getCategoryColor } from '@/constants/Categories';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { showToast } = useToast();

  // Get store selectors
  const transactions = useStore((state: StoreState) => state.transactions);
  const loading = useStore((state: StoreState) => state.loading);
  const error = useStore((state: StoreState) => state.error);
  const pagination = useStore((state: StoreState) => state.pagination);
  const fetchTransactions = useStore((state: StoreState) => state.fetchTransactions);
  const setTransactions = useStore((state: StoreState) => state.setTransactions);
  const stats = useStore((state: StoreState) => state.stats);
  const getUserStats = useStore((state: StoreState) => state.getUserStats);
  const deleteTransaction = useStore((state: StoreState) => state.deleteTransaction);
  const updateTransaction = useStore((state: StoreState) => state.updateTransaction);

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' },
  ];

  // Load transactions with current filter
  const loadTransactions = useCallback(async (page = 1) => {
    try {
      // Reset transactions when changing filters or refreshing
      if (page === 1) {
        setTransactions([]);
      }

      // Only include type parameter if not 'all'
      const params: {
        type?: 'income' | 'expense';
        page?: number;
        limit?: number;
      } = {
        page,
        limit: 10
      };

      if (activeFilter !== 'all') {
        params.type = activeFilter;
      }

      await fetchTransactions(params);
    } catch (error: any) {
      showToast(error?.message || 'Failed to load transactions', 'error');
    }
  }, [activeFilter, fetchTransactions, showToast, setTransactions]);

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Load stats
  useEffect(() => {
    getUserStats().catch((error) => {
      showToast(error?.message || 'Failed to load stats', 'error');
    });
  }, [getUserStats, showToast]);

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Refresh transactions when filter changes
  useEffect(() => {
    loadTransactions(1);
  }, [activeFilter, loadTransactions]);

  // Handle refresh
  const handleRefresh = () => {
    loadTransactions(1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      loadTransactions(pagination.currentPage + 1);
    }
  };

  // Handle transaction selection
  const handleTransactionSelect = (transaction: TransactionType) => {
    router.push({
      pathname: '/(modals)/transactions/add',
      params: { id: transaction._id }
    });
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction: TransactionType) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction._id);
              showToast('Transaction deleted successfully', 'success');
              // Refresh transactions
              loadTransactions(1);
            } catch (error: any) {
              showToast(error?.message || 'Failed to delete transaction', 'error');
            }
          },
        },
      ]
    );
  };

  // Handle update transaction
  const handleUpdateTransaction = (transaction: TransactionType) => {
    router.push({
      pathname: '/(modals)/transactions/add',
      params: { 
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        note: transaction.note,
        date: transaction.date
      }
    });
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions(1);
      getUserStats().catch((error) => {
        showToast(error?.message || 'Failed to load stats', 'error');
      });
    }, [loadTransactions, getUserStats, showToast])
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.light.text }]}>Transactions</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.light.card }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryLabel, { color: colors.gray[600] }]} numberOfLines={1}>
              Total Income
            </Text>
            <View style={[styles.iconContainer, { backgroundColor: colors.success[600] + '20' }]}>
              <ArrowUpRight size={16} color={colors.success[600]} />
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.success[600] }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totals.income || 0)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.light.card }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryLabel, { color: colors.gray[600] }]} numberOfLines={1}>
              Total Expense
            </Text>
            <View style={[styles.iconContainer, { backgroundColor: colors.error[600] + '20' }]}>
              <ArrowDownLeft size={16} color={colors.error[600]} />
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.error[600] }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totals.expense || 0)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.light.card }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryLabel, { color: colors.gray[600] }]} numberOfLines={1}>
              Balance
            </Text>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[600] + '20' }]}>
              <Ionicons name="wallet-outline" size={16} color={colors.primary[600]} />
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.primary[600] }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totals.balance || 0)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.light.card }]}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterTab,
              activeFilter === filter.value && {
                backgroundColor: colors.primary[600],
              },
            ]}
            onPress={() => handleFilterChange(filter.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                {
                  color: activeFilter === filter.value ? colors.light.background : colors.gray[500],
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            key={item._id}
            style={[styles.transactionItem, { backgroundColor: colors.light.card }]}
            onPress={() => handleTransactionSelect(item)}
          >
            <View style={styles.transactionInfo}>
              <View style={styles.transactionHeader}>
                <Text style={[styles.transactionTitle, { color: colors.light.text }]}>
                  {item.note || item.category || 'No description'}
                </Text>
              </View>
              <Text style={[styles.transactionDate, { color: colors.gray[500] }]}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.transactionActions}>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color:
                      item.type === 'income'
                        ? colors.success[600]
                        : colors.error[600],
                  },
                ]}
              >
                {item.type === 'income' ? '+' : '-'}
                {formatCurrency(item.amount)}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary[600] + '20' }]}
                  onPress={() => handleUpdateTransaction(item)}
                >
                  <Ionicons name="pencil" size={16} color={colors.primary[600]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error[600] + '20' }]}
                  onPress={() => handleDeleteTransaction(item)}
                >
                  <Ionicons name="trash" size={16} color={colors.error[600]} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[colors.primary[600]]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray[500] }]}>
              {error || 'No transactions found'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary[600] }]}
        onPress={() => router.push('/(modals)/transactions/add')}
      >
        <Ionicons name="add" size={24} color={colors.light.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Metrics.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: Metrics.sm,
    marginHorizontal: Metrics.lg,
    borderRadius: Metrics.borderRadius.full,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Metrics.sm,
    alignItems: 'center',
    borderRadius: Metrics.borderRadius.full,
  },
  filterLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  listContent: {
    padding: Metrics.md,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Metrics.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Metrics.lg,
    bottom: Metrics.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: Metrics.lg,
    paddingBottom: Metrics.md,
    gap: Metrics.xs,
  },
  summaryCard: {
    flex: 1,
    padding: Metrics.sm,
    borderRadius: Metrics.borderRadius.md,
    minWidth: 0,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.xs,
  },
  summaryLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
    flex: 1,
    marginRight: Metrics.xs,
  },
  summaryAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  transactionActions: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Metrics.xs,
    marginTop: Metrics.xs,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});