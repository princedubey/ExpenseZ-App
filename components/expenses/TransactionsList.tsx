import React from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import { TransactionType } from '@/types';
import TransactionItem from './TransactionItem';

interface TransactionsListProps {
  transactions: TransactionType[];
  loading?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onSelectTransaction?: (transaction: TransactionType) => void;
  emptyMessage?: string;
}

export function TransactionsList({
  transactions,
  loading = false,
  onRefresh,
  onLoadMore,
  onSelectTransaction,
  emptyMessage = 'No transactions found',
}: TransactionsListProps) {
  const colors = useColors();

  // Group transactions by date
  const groupTransactionsByDate = () => {
    const groups: { [key: string]: TransactionType[] } = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(transaction);
    });
    
    const result: { title: string; data: TransactionType[] }[] = [];
    
    Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach((dateKey) => {
        const date = new Date(dateKey);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let title: string;
        
        if (date.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
          title = 'Today';
        } else if (date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          title = 'Yesterday';
        } else {
          title = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }
        
        result.push({
          title,
          data: groups[dateKey],
        });
      });
    
    return result;
  };
  
  const groupedTransactions = groupTransactionsByDate();
  
  const renderSectionHeader = ({ title }: { title: string }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.light.card }]}>
      <Text style={[styles.sectionHeaderText, { color: colors.gray[700] }]}>{title}</Text>
    </View>
  );
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.gray[500] }]}>{emptyMessage}</Text>
    </View>
  );
  
  if (transactions.length === 0 && !loading) {
    return renderEmptyComponent();
  }
  
  return (
    <FlatList
      data={groupedTransactions}
      keyExtractor={(item) => item.title}
      renderItem={({ item }) => (
        <>
          {renderSectionHeader(item)}
          {item.data.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onPress={onSelectTransaction}
            />
          ))}
        </>
      )}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary[600]]} />
        ) : undefined
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.1}
      style={[styles.list, { backgroundColor: colors.light.background }]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.sm,
  },
  sectionHeaderText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
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
});

export default TransactionsList;