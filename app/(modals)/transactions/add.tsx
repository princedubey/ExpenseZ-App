import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Metrics } from '@/constants/Metrics';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryInput from '@/components/ui/CategoryInput';
import { Ionicons } from '@expo/vector-icons';

type DateRange = { startDate: Date | null; endDate: Date | null };

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log('[add.tsx] Mounted with search parameters:', params);
  const colors = useColors();
  const [type, setType] = useState<'cash_in' | 'cash_out' | 'investment' | 'loan'>(
    (params.type as 'cash_in' | 'cash_out' | 'investment' | 'loan') || 'cash_out'
  );
  const [source, setSource] = useState<'balance' | 'existing'>((params.source as 'balance' | 'existing') || 'balance');
  const [amount, setAmount] = useState(params.amount?.toString() || '');
  const [category, setCategory] = useState(params.category?.toString() || '');
  const [note, setNote] = useState(params.note?.toString() || '');
  const [date, setDate] = useState(params.date ? new Date(params.date as string) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
  }>({});

  const isEditMode = !!params.id && params.id !== 'undefined';

  // Memoize store selectors
  const addTransaction = useStore(useCallback((state) => state.addTransaction, []));
  const updateTransaction = useStore(useCallback((state) => state.updateTransaction, []));
  const deleteTransaction = useStore(useCallback((state) => state.deleteTransaction, []));
  const fetchTransactionById = useStore(useCallback((state) => state.fetchTransactionById, []));
  const loading = useStore(useCallback((state) => state.loading, []));
  const user = useStore(useCallback((state) => state.user, []));
  const stats = useStore(useCallback((state) => state.stats, []));
  const { showToast } = useToast();

  // Load existing transaction data in edit mode
  useEffect(() => {
    if (isEditMode && params.id) {
      const loadTransaction = async () => {
        try {
          const t = await fetchTransactionById(params.id as string);
          if (t) {
            setAmount(t.amount.toString());
            setType(t.type);
            setSource(t.source || 'balance');
            setCategory(t.category === 'Uncategorized' ? '' : t.category);
            setNote(t.note || '');
            setDate(new Date(t.transactionDate || t.date || t.createdAt));
          }
        } catch (error: any) {
          showToast('Failed to load transaction details', 'error');
        }
      };
      loadTransaction();
    }
  }, [isEditMode, params.id, fetchTransactionById, showToast]);

  const validateForm = useCallback(() => {
    const newErrors: { amount?: string } = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount]);

  // Sanitize amount input to digits only
  const handleAmountChange = useCallback((value: string) => {
    const sanitized = value.replace(/\D+/g, '');
    setAmount(sanitized);
  }, []);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      showToast('Please sign in to add transactions', 'error');
      return;
    }

    if (!validateForm()) {
      showToast('Please check required fields', 'error');
      return;
    }

    try {
      const transaction = {
        amount: Number(amount),
        type,
        source,
        category: category || 'Uncategorized',
        note: note || '',
        title: note || category || 'Transaction',
        transactionDate: date.toISOString(),
      };

      if (isEditMode) {
        await updateTransaction(params.id as string, transaction);
        showToast('Transaction updated successfully', 'success');
      } else {
        await addTransaction(transaction);
        showToast(
          `Successfully added ${type === 'cash_in' ? 'cash in' : type === 'cash_out' ? 'cash out' : 'investment'}`,
          'success'
        );
      }
      router.back();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} transaction`;
      showToast(errorMessage, 'error');
    }
  }, [validateForm, user, amount, type, category, note, date, addTransaction, updateTransaction, showToast, router, isEditMode, params.id, source]);

  const handleDelete = useCallback(() => {
    if (!params.id) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(params.id as string);
              showToast('Transaction deleted successfully', 'success');
              router.back();
            } catch (error: any) {
              showToast(error?.message || 'Failed to delete transaction', 'error');
            }
          },
        },
      ]
    );
  }, [deleteTransaction, params.id, router, showToast]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.light.border }]}>
          <TouchableOpacity
            style={[styles.headerCircleButton, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="close-outline" size={20} color={colors.light.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.light.text }]}>
            {isEditMode ? 'Update Transaction' : 'Add Transaction'}
          </Text>
          {isEditMode ? (
            <TouchableOpacity
              style={[styles.headerCircleButton, { backgroundColor: colors.error[50] + '15', borderColor: colors.error[600] + '20' }]}
              onPress={handleDelete}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error[600]} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Amount Input Container */}
          <View style={[styles.heroAmountContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <Text style={[styles.heroAmountLabel, { color: colors.gray[400] }]}>TRANSACTION AMOUNT</Text>
            <View style={styles.heroAmountRow}>
              <Text style={[styles.heroAmountCurrency, { color: colors.light.text }]}>₹</Text>
              <TextInput
                style={[styles.heroAmountInput, { color: colors.light.text }]}
                placeholder="0"
                placeholderTextColor={colors.gray[300]}
                keyboardType="numeric"
                value={amount ? new Intl.NumberFormat('en-IN').format(Number(amount)) : ''}
                onChangeText={handleAmountChange}
                autoFocus
                selectionColor={colors.primary[500]}
              />
            </View>
            {errors.amount && (
              <Text style={[styles.heroErrorText, { color: colors.error[500] }]}>
                {errors.amount}
              </Text>
            )}
          </View>

          {/* Transaction Type Segment Switcher */}
          <View style={[styles.typeSelectorContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            {[
              { label: 'Cash Out', value: 'cash_out' as const, activeColor: colors.error[600], shadowColor: colors.error[600] },
              { label: 'Cash In', value: 'cash_in' as const, activeColor: colors.success[600], shadowColor: colors.success[600] },
              { label: 'Investment', value: 'investment' as const, activeColor: colors.primary[600], shadowColor: colors.primary[600] },
            ].map((option) => {
              const isActive = type === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeSegmentButton,
                    isActive && {
                      backgroundColor: option.activeColor,
                      shadowColor: option.shadowColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.24,
                      shadowRadius: 8,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => {
                    setType(option.value);
                    setCategory('');
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.typeSegmentText,
                      {
                        color: isActive ? '#ffffff' : colors.gray[500],
                        fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.fieldsCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            {/* Note Input */}
            <View style={styles.fieldContainer}>
              <Input
                label="NOTE"
                placeholder="What is this transaction for? (optional)"
                value={note}
                onChangeText={setNote}
                containerStyle={{ marginBottom: 0 }}
                labelStyle={styles.fieldLabel}
              />
            </View>

            {/* Date Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.gray[400] }]}>TRANSACTION DATE</Text>
              <TouchableOpacity
                style={[styles.pickerTriggerButton, { backgroundColor: colors.light.background, borderColor: colors.light.border }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary[600]} style={{ marginRight: 8 }} />
                <Text style={[styles.pickerTriggerText, { color: colors.light.text }]}>
                  {date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward-outline" size={16} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>

            {/* Category Field */}
            <View style={[styles.fieldContainer, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.fieldLabel, { color: colors.gray[400] }]}>CATEGORY</Text>
              <CategoryInput
                value={category}
                onChange={setCategory}
                type={type}
                placeholder="Select category"
              />
              {errors.category && (
                <Text style={[styles.fieldErrorText, { color: colors.error[500] }]}>
                  {errors.category}
                </Text>
              )}
            </View>
          </View>

          {/* Source selector for investments */}
          {type === 'investment' && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.gray[400], marginLeft: Metrics.sm, marginBottom: 8 }]}>INVESTMENT SOURCE</Text>
              <View style={[styles.sourceSelectorContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                {[
                  { label: 'Deduct from balance', value: 'balance' as const },
                  { label: 'Existing investment', value: 'existing' as const },
                ].map((option) => {
                  const isActive = source === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sourceSegmentButton,
                        isActive && { backgroundColor: colors.primary[600] }
                      ]}
                      onPress={() => setSource(option.value)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.sourceSegmentText,
                          {
                            color: isActive ? '#ffffff' : colors.gray[500],
                            fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Impact preview card */}
          {type === 'investment' && source === 'balance' && amount && !isNaN(Number(amount)) && stats && (
            <View style={[styles.previewCard, { backgroundColor: colors.primary[50] + '12', borderColor: colors.primary[600] + '20' }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary[600]} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewLabel, { color: colors.gray[500] }]}>Balance after deduction</Text>
                <Text style={[styles.previewValue, { color: colors.light.text }]}>
                  {formatCurrency((stats?.savings || 0) - Number(amount))}
                </Text>
              </View>
            </View>
          )}

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
    paddingHorizontal: Metrics.lg,
    paddingVertical: Metrics.md,
    borderBottomWidth: 1,
  },
  headerCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.lg,
  },
  content: {
    flex: 1,
    padding: Metrics.lg,
  },
  scrollContent: {
    gap: Metrics.lg,
    paddingBottom: Metrics.xxl,
  },
  heroAmountContainer: {
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    padding: Metrics.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  heroAmountLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: Metrics.xs,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroAmountCurrency: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 28,
    marginRight: 6,
  },
  heroAmountInput: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 36,
    minWidth: 100,
    textAlign: 'left',
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  heroErrorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: Metrics.xs,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    borderRadius: Metrics.borderRadius.full,
    borderWidth: 1,
    padding: 3,
  },
  typeSegmentButton: {
    flex: 1,
    paddingVertical: Metrics.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrics.borderRadius.full,
  },
  typeSegmentText: {
    fontSize: Metrics.fontSizes.sm,
  },
  fieldsCard: {
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    padding: Metrics.lg,
    gap: Metrics.md,
  },
  fieldContainer: {
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Metrics.md,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  fieldErrorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 2,
  },
  pickerTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.lg,
    paddingHorizontal: Metrics.md,
    height: 48,
  },
  pickerTriggerText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  sourceSelectorContainer: {
    flexDirection: 'row',
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    padding: 3,
  },
  sourceSegmentButton: {
    flex: 1,
    paddingVertical: Metrics.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrics.borderRadius.lg,
  },
  sourceSegmentText: {
    fontSize: Metrics.fontSizes.xs + 1,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
  },
  previewLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
    marginBottom: 2,
  },
  previewValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  submitButton: {
    marginTop: Metrics.md,
  },
});