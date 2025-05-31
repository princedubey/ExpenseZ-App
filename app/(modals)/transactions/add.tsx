import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, X } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryInput from '@/components/ui/CategoryInput';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useColors();
  const [type, setType] = useState<'income' | 'expense'>(params.type as 'income' | 'expense' || 'expense');
  const [amount, setAmount] = useState(params.amount?.toString() || '');
  const [category, setCategory] = useState(params.category?.toString() || '');
  const [note, setNote] = useState(params.note?.toString() || '');
  const [date, setDate] = useState(params.date ? new Date(params.date as string) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
  }>({});

  const isEditMode = !!params.id;

  // Memoize store selectors
  const addTransaction = useStore(useCallback((state) => state.addTransaction, []));
  const updateTransaction = useStore(useCallback((state) => state.updateTransaction, []));
  const loading = useStore(useCallback((state) => state.loading, []));
  const user = useStore(useCallback((state) => state.user, []));
  const { showToast } = useToast();

  const validateForm = useCallback(() => {
    const newErrors: { amount?: string; category?: string } = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, category]);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      showToast('Please sign in to add transactions', 'error');
      return;
    }

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      const transaction = {
        amount: Number(amount),
        type,
        category,
        note: note || '',
        date: date.toISOString(),
      };

      if (isEditMode) {
        await updateTransaction(params.id as string, transaction);
        showToast('Transaction updated successfully', 'success');
      } else {
        await addTransaction(transaction);
        showToast(
          `Successfully added ${type === 'income' ? 'income' : 'expense'}`,
          'success'
        );
      }
      router.back();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} transaction`;
      showToast(errorMessage, 'error');
    }
  }, [validateForm, user, amount, type, category, note, date, addTransaction, updateTransaction, showToast, router, isEditMode, params.id]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.light.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={Metrics.iconSize.md} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.light.text }]}>
            {isEditMode ? 'Update Transaction' : 'Add Transaction'}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transaction Type Selector */}
          <View style={[styles.typeSelector, { backgroundColor: colors.light.card }]}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && { backgroundColor: colors.error[50] },
              ]}
              onPress={() => setType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === 'expense' ? colors.error[600] : colors.gray[600] },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && { backgroundColor: colors.success[50] },
              ]}
              onPress={() => setType('income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === 'income' ? colors.success[600] : colors.gray[600] },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Input
            label="Amount"
            placeholder="Enter amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            error={errors.amount}
            prefix="₹"
          />

          {/* Category Input */}
          <View style={styles.categoryContainer}>
            <Text style={[styles.label, { color: colors.gray[700] }]}>Category</Text>
            <CategoryInput
              value={category}
              onChange={setCategory}
              type={type}
              placeholder="Select or enter category"
            />
            {errors.category && (
              <Text style={[styles.errorText, { color: colors.error[600] }]}>
                {errors.category}
              </Text>
            )}
          </View>

          {/* Date Picker */}
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.light.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={Metrics.iconSize.sm} color={colors.gray[500]} />
            <Text style={[styles.dateText, { color: colors.light.text }]}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {/* Note Input */}
          <Input
            label="Note"
            placeholder="Add a note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <Button
            title={isEditMode ? "Update Transaction" : "Add Transaction"}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Metrics.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.lg,
  },
  content: {
    flex: 1,
    padding: Metrics.md,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: Metrics.lg,
    borderRadius: Metrics.borderRadius.lg,
    padding: Metrics.xs,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Metrics.sm,
    alignItems: 'center',
    borderRadius: Metrics.borderRadius.md,
  },
  typeButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  categoryContainer: {
    marginBottom: Metrics.lg,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
    marginBottom: Metrics.xs,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    marginTop: Metrics.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.md,
    marginBottom: Metrics.lg,
  },
  dateText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
    marginLeft: Metrics.sm,
  },
  submitButton: {
    marginTop: Metrics.xl,
    marginBottom: Metrics.xxl,
  },
}); 