import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import { CategoryType } from '@/types';

interface CategorySelectorProps {
  type: 'cash_in' | 'cash_out' | 'investment';
  selectedCategory: CategoryType | null;
  onSelectCategory: (category: CategoryType) => void;
  error?: string;
}

const expenseCategories: CategoryType[] = [
  {
    id: '1',
    name: 'Groceries',
    icon: 'shopping-cart',
    color: '#4CAF50',
  },
  {
    id: '2',
    name: 'Dining',
    icon: 'coffee',
    color: '#FF9800',
  },
  {
    id: '3',
    name: 'Transport',
    icon: 'car',
    color: '#2196F3',
  },
  {
    id: '4',
    name: 'Entertainment',
    icon: 'film',
    color: '#9C27B0',
  },
  {
    id: '5',
    name: 'Shopping',
    icon: 'shopping-bag',
    color: '#F44336',
  },
];

const incomeCategories: CategoryType[] = [
  {
    id: '6',
    name: 'Salary',
    icon: 'briefcase',
    color: '#4CAF50',
  },
  {
    id: '7',
    name: 'Freelance',
    icon: 'laptop',
    color: '#2196F3',
  },
  {
    id: '8',
    name: 'Investments',
    icon: 'trending-up',
    color: '#9C27B0',
  },
  {
    id: '9',
    name: 'Gifts',
    icon: 'gift',
    color: '#FF9800',
  },
  {
    id: '10',
    name: 'Other',
    icon: 'more-horizontal',
    color: '#607D8B',
  },
];

export default function CategorySelector({
  type,
  selectedCategory,
  onSelectCategory,
  error,
}: CategorySelectorProps) {
  const colors = useColors();
  const categories = type === 'cash_in' ? incomeCategories : expenseCategories;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory?.id === category.id && {
                backgroundColor: category.color + '20',
                borderColor: category.color,
              },
            ]}
            onPress={() => onSelectCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    selectedCategory?.id === category.id
                      ? category.color
                      : colors.gray[700],
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {error && (
        <Text style={[styles.errorText, { color: colors.error[500] }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Metrics.xs,
  },
  categoryButton: {
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.sm,
    borderRadius: Metrics.borderRadius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: Metrics.sm,
  },
  categoryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    marginTop: Metrics.xs,
  },
}); 