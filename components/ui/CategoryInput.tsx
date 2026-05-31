import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, INVESTMENT_CATEGORIES, getCategoryColor } from '@/constants/Categories';

interface CategoryInputProps {
  value: string;
  onChange: (category: string) => void;
  type: 'cash_in' | 'cash_out' | 'investment' | 'loan';
  placeholder?: string;
}

export default function CategoryInput({
  value,
  onChange,
  type,
  placeholder = 'Select or enter category',
}: CategoryInputProps) {
  const colors = useColors();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    if (type === 'cash_in') return Object.values(INCOME_CATEGORIES);
    if (type === 'investment') return Object.values(INVESTMENT_CATEGORIES);
    return Object.values(EXPENSE_CATEGORIES);
  }, [type]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(category =>
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleSelectCategory = useCallback((category: string) => {
    onChange(category);
    setIsModalVisible(false);
    setSearchQuery('');
  }, [onChange]);

  const handleAddNewCategory = useCallback(() => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim());
      setIsModalVisible(false);
      setSearchQuery('');
    }
  }, [searchQuery, onChange]);

  return (
    <>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.light.card }]}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.inputContent}>
          {value ? (
            <>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: getCategoryColor(value) + '20' },
                ]}
              />
              <Text style={[styles.selectedCategory, { color: colors.light.text }]}>
                {value}
              </Text>
            </>
          ) : (
            <Text style={[styles.placeholder, { color: colors.gray[500] }]}>
              {placeholder}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.light.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.light.text }]}>
              Select Category
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color={colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.light.card }]}>
            <Search size={20} color={colors.gray[500]} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.light.text }]}
              placeholder="Search categories..."
              placeholderTextColor={colors.gray[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryItem, { backgroundColor: colors.light.card }]}
                onPress={() => handleSelectCategory(item)}
              >
                <View style={styles.categoryItemContent}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(item) + '20' },
                    ]}
                  />
                  <Text style={[styles.categoryText, { color: colors.light.text }]}>
                    {item}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery ? (
                <TouchableOpacity
                  style={[styles.addNewCategory, { backgroundColor: colors.light.card }]}
                  onPress={handleAddNewCategory}
                >
                  <Text style={[styles.addNewCategoryText, { color: colors.primary[600] }]}>
                    Add {"\""}{searchQuery}{"\""} as new category
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: Metrics.borderRadius.md,
    paddingHorizontal: Metrics.md,
    justifyContent: 'center',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Metrics.xs,
  },
  selectedCategory: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  placeholder: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
  },
  modalContainer: {
    flex: 1,
    marginTop: Metrics.xxl * 2,
    borderTopLeftRadius: Metrics.borderRadius.xl,
    borderTopRightRadius: Metrics.borderRadius.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Metrics.lg,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.lg,
  },
  closeButton: {
    padding: Metrics.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Metrics.md,
    paddingHorizontal: Metrics.md,
    height: 48,
    borderRadius: Metrics.borderRadius.md,
  },
  searchIcon: {
    marginRight: Metrics.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
  },
  categoryItem: {
    padding: Metrics.md,
    marginHorizontal: Metrics.md,
    marginBottom: Metrics.xs,
    borderRadius: Metrics.borderRadius.md,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  addNewCategory: {
    padding: Metrics.md,
    margin: Metrics.md,
    borderRadius: Metrics.borderRadius.md,
    alignItems: 'center',
  },
  addNewCategoryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
}); 