import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import { BudgetType } from '@/types';
import Card from '@/components/ui/Card';

interface BudgetCardProps {
  budget: BudgetType;
  categoryName: string;
  onPress?: (budget: BudgetType) => void;
}

export function BudgetCard({ budget, categoryName, onPress }: BudgetCardProps) {
  const { amount, spent, period } = budget;
  const progress = Math.min(spent / amount, 1);
  const remaining = amount - spent;
  const isOverBudget = spent > amount;
  
  // Calculate progress bar color based on percentage
  const getProgressColor = () => {
    if (progress < 0.7) return Colors.success[500];
    if (progress < 0.9) return Colors.warning[500];
    return Colors.error[500];
  };
  
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  return (
    <Card style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress && onPress(budget)}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <Text style={styles.categoryName}>{categoryName}</Text>
          <View style={styles.periodContainer}>
            <Text style={styles.periodText}>{period}</Text>
          </View>
        </View>
        
        <View style={styles.budgetInfo}>
          <Text style={styles.amountText}>
            {formatCurrency(spent)} <Text style={styles.ofText}>of</Text> {formatCurrency(amount)}
          </Text>
          {isOverBudget ? (
            <Text style={styles.overBudgetText}>
              Over by {formatCurrency(Math.abs(remaining))}
            </Text>
          ) : (
            <Text style={styles.remainingText}>
              {formatCurrency(remaining)} remaining
            </Text>
          )}
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress * 100}%`, backgroundColor: getProgressColor() },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onPress && onPress(budget)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Edit2 size={Metrics.iconSize.sm} color={Colors.gray[500]} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Metrics.md,
  },
  touchable: {
    padding: Metrics.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.sm,
  },
  categoryName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[800],
  },
  periodContainer: {
    backgroundColor: Colors.gray[200],
    paddingHorizontal: Metrics.sm,
    paddingVertical: Metrics.xs / 2,
    borderRadius: Metrics.borderRadius.sm,
  },
  periodText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
    color: Colors.gray[700],
    textTransform: 'capitalize',
  },
  budgetInfo: {
    marginBottom: Metrics.sm,
  },
  amountText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[800],
    marginBottom: Metrics.xs / 2,
  },
  ofText: {
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  remainingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    color: Colors.success[600],
  },
  overBudgetText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    color: Colors.error[600],
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: Metrics.borderRadius.full,
    overflow: 'hidden',
    marginRight: Metrics.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: Metrics.borderRadius.full,
  },
  progressText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
    color: Colors.gray[600],
    width: 40,
    textAlign: 'right',
  },
  editButton: {
    position: 'absolute',
    top: Metrics.md,
    right: Metrics.md,
  },
});

export default BudgetCard;