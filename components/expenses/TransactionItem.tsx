import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import { TransactionType } from '@/types';

interface TransactionItemProps {
  transaction: TransactionType;
  onPress?: (transaction: TransactionType) => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const colors = useColors();
  const { amount, type, category, date, note } = transaction;
  
  // Format date to readable string
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
  
  // Format amount with positive/negative sign and rupee symbol
  const formattedAmount = `${type === 'income' ? '+' : '-'}₹${Math.abs(amount).toLocaleString('en-IN')}`;
  
  return (
    <TouchableOpacity
      style={[styles.container, { 
        backgroundColor: colors.light.background,
        borderBottomColor: colors.light.border 
      }]}
      onPress={() => onPress && onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
        {type === 'income' ? (
          <ArrowUpRight size={Metrics.iconSize.md} color={colors.success[600]} />
        ) : (
          <ArrowDownLeft size={Metrics.iconSize.md} color={colors.error[600]} />
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.mainDetails}>
          <Text style={[styles.category, { color: colors.light.text }]}>{category.name}</Text>
          <Text
            style={[
              styles.amount,
              type === 'income' ? { color: colors.success[600] } : { color: colors.error[600] },
            ]}
          >
            {formattedAmount}
          </Text>
        </View>
        
        <View style={styles.secondaryDetails}>
          {note ? (
            <Text style={[styles.note, { color: colors.gray[500] }]} numberOfLines={1}>
              {note}
            </Text>
          ) : null}
          <Text style={[styles.date, { color: colors.gray[500] }]}>{formattedDate}</Text>
        </View>
      </View>
      
      <ChevronRight size={Metrics.iconSize.sm} color={colors.gray[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Metrics.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Metrics.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Metrics.md,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  mainDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.xs / 2,
  },
  category: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  amount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
  secondaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  note: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    flex: 1,
    marginRight: Metrics.sm,
  },
  date: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
  },
});

export default TransactionItem;