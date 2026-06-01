import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import { CategoryType } from '@/types';

interface CategoryPickerProps {
  categories: CategoryType[];
  selectedCategory?: CategoryType | null;
  onSelectCategory: (category: CategoryType) => void;
}

export function CategoryPicker({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id || item._id || ''}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              selectedCategory?.id === item.id && styles.selectedItem,
              { borderColor: item.color },
            ]}
            onPress={() => onSelectCategory(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              {/* You would render the icon here based on item.icon */}
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Metrics.md,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
    color: Colors.gray[700],
    marginBottom: Metrics.sm,
  },
  list: {
    paddingVertical: Metrics.xs,
  },
  categoryItem: {
    width: 100,
    height: 120,
    borderRadius: Metrics.borderRadius.md,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Metrics.md,
    padding: Metrics.sm,
  },
  selectedItem: {
    borderWidth: 2,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Metrics.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Metrics.sm,
  },
  categoryName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
    color: Colors.gray[800],
    textAlign: 'center',
  },
});

export default CategoryPicker;