import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const CATEGORY_KEYWORDS: { [key: string]: { keywords: string[]; category: string }[] } = {
  cash_out: [
    { category: 'Food & Dining', keywords: ['food', 'dining', 'restaurant', 'cafe', 'lunch', 'dinner', 'swiggy', 'zomato', 'mcdonald', 'burger', 'pizza', 'starbucks', 'eat', 'grocery', 'bakery', 'sweet'] },
    { category: 'Transport', keywords: ['uber', 'ola', 'cab', 'taxi', 'auto', 'metro', 'train', 'bus', 'fuel', 'petrol', 'diesel', 'cng', 'parking', 'toll', 'car wash'] },
    { category: 'Shopping', keywords: ['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'dress', 'mall', 'purchase', 'gadget', 'phone', 'laptop', 'device'] },
    { category: 'Entertainment', keywords: ['movie', 'cinema', 'theatre', 'show', 'netflix', 'spotify', 'prime', 'hotstar', 'youtube', 'concert', 'game', 'gaming', 'pub', 'club', 'party', 'bar'] },
    { category: 'Bills & Utilities', keywords: ['bill', 'electricity', 'water', 'gas', 'wifi', 'internet', 'recharge', 'broadband', 'phone bill', 'postpaid', 'tv', 'dth'] },
    { category: 'EMI', keywords: ['emi', 'housing emi', 'car emi', 'loan emi', 'installment'] },
    { category: 'Loan Repayment', keywords: ['loan repayment', 'repay', 'debt', 'borrowed'] },
    { category: 'Health & Medical', keywords: ['doctor', 'hospital', 'medicine', 'clinic', 'pharmacy', 'medical', 'dental', 'health checkup', 'dentist', 'lab'] },
    { category: 'Education', keywords: ['school', 'college', 'tuition', 'fees', 'books', 'course', 'class', 'stationery', 'udemy', 'coursera'] },
    { category: 'Travel', keywords: ['flight', 'hotel', 'trip', 'travel', 'vacation', 'holiday', 'booking', 'train ticket', 'air ticket', 'irctc'] },
    { category: 'Groceries', keywords: ['grocery', 'groceries', 'milk', 'vegetable', 'fruit', 'blinkit', 'zepto', 'instamart', 'supermarket', 'bigbasket', 'ration'] },
    { category: 'Rent', keywords: ['rent', 'house rent', 'flat rent', 'room rent', 'landlord'] },
    { category: 'Subscriptions', keywords: ['subscription', 'netflix sub', 'spotify sub', 'youtube premium', 'gym membership', 'adobe', 'icloud', 'gdrive'] },
    { category: 'Insurance', keywords: ['insurance', 'lic', 'premium', 'policy', 'term insurance', 'health insurance', 'car insurance'] },
    { category: 'Personal Care', keywords: ['salon', 'parlor', 'spa', 'barber', 'haircut', 'shaving', 'makeup', 'cosmetics', 'grooming', 'gym', 'workout'] },
  ],
  cash_in: [
    { category: 'Salary', keywords: ['salary', 'paycheck', 'wages', 'bonus', 'stipend', 'pension', 'company pay'] },
    { category: 'Business', keywords: ['business', 'client', 'sales', 'revenue', 'invoice', 'customer', 'vendor', 'partnership'] },
    { category: 'Investment', keywords: ['dividend', 'interest', 'fd interest', 'stock returns', 'capital gain', 'mutual fund returns'] },
    { category: 'Rental Income', keywords: ['rental', 'rent received', 'tenant', 'lease', 'sublet'] },
    { category: 'Freelance', keywords: ['freelance', 'upwork', 'fiverr', 'project', 'contract', 'gigs', 'consulting'] },
    { category: 'FD Break', keywords: ['fd break', 'broken fd', 'fixed deposit broken', 'break fd'] },
  ],
  investment: [
    { category: 'FD', keywords: ['fd', 'fixed deposit', 'term deposit', 'suryoday', 'hdfc fd', 'sbi fd', 'axis fd', 'icici fd'] },
    { category: 'RD', keywords: ['rd', 'recurring deposit'] },
    { category: 'SIP', keywords: ['sip', 'monthly sip', 'mutual fund sip', 'sip payment'] },
    { category: 'PPF', keywords: ['ppf', 'public provident fund'] },
    { category: 'EPF', keywords: ['epf', 'provident fund', 'pf'] },
    { category: 'Stock', keywords: ['stock', 'stocks', 'share', 'shares', 'zerodha', 'groww', 'angelone', 'equity', 'demat'] },
    { category: 'Mutual Fund', keywords: ['mutual fund', 'mf', 'lumpsum', 'fund', 'uti', 'parag parikh', 'quant', 'sbi mutual'] },
    { category: 'ETF', keywords: ['etf', 'nifty50 etf', 'gold etf'] },
    { category: 'Crypto', keywords: ['crypto', 'bitcoin', 'ethereum', 'btc', 'eth', 'wazirx', 'coinswitch', 'usdt'] },
    { category: 'Gold', keywords: ['gold', 'sovereign gold', 'sgb', 'silver', 'jewelry'] },
    { category: 'Real Estate', keywords: ['real estate', 'property', 'land', 'plot', 'flat purchase', 'house purchase'] },
  ],
  loan: [
    { category: 'Loan Repayment', keywords: ['repayment', 'pay back', 'settle loan', 'repay loan'] },
    { category: 'EMI', keywords: ['emi', 'installment', 'monthly installment'] },
  ],
};

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
  const [isBroken, setIsBroken] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [breakFdId, setBreakFdId] = useState(params.breakFdId?.toString() || '');

  const transactions = useStore((state) => state.transactions);

  const activeFds = useMemo(() => {
    return transactions.filter(
      (t) => 
        t.type === 'investment' && 
        t.category === 'FD' && 
        (!t.isBroken || t._id === breakFdId || t.id === breakFdId)
    );
  }, [transactions, breakFdId]);

  const suggestedCategory = useMemo(() => {
    const trimmedNote = note.trim().toLowerCase();
    if (!trimmedNote) return null;

    const listKey = type === 'loan' ? 'loan' : type === 'cash_in' ? 'cash_in' : type === 'investment' ? 'investment' : 'cash_out';
    const mappings = CATEGORY_KEYWORDS[listKey] || [];

    for (const item of mappings) {
      for (const keyword of item.keywords) {
        if (trimmedNote.includes(keyword)) {
          return item.category;
        }
      }
    }
    return null;
  }, [note, type]);

  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
  }>({});
  const [existingNotes, setExistingNotes] = useState<string[]>([]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const stored = await AsyncStorage.getItem('@expensez_transactions');
        if (stored) {
          const allTx: any[] = JSON.parse(stored);
          const notes = allTx
            .map((t) => t.note || t.title)
            .filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
          
          const uniqueNotes = Array.from(new Set(notes));
          setExistingNotes(uniqueNotes);
        }
      } catch (error) {
        console.error('[add.tsx] Failed to load notes:', error);
      }
    };
    loadNotes();
  }, []);

  const filteredSuggestions = note.trim()
    ? existingNotes
        .filter((n) => n.toLowerCase().includes(note.toLowerCase()) && n.toLowerCase() !== note.toLowerCase())
        .slice(0, 8)
    : existingNotes.slice(0, 8);

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
            setIsBroken(!!t.isBroken);
            setIsActive(t.isActive !== false);
            setBreakFdId(t.breakFdId || '');
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
        isBroken,
        isActive,
        breakFdId: type === 'cash_in' && category === 'FD Break' ? breakFdId : undefined,
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
  }, [validateForm, user, amount, type, category, note, date, addTransaction, updateTransaction, showToast, router, isEditMode, params.id, source, isBroken, isActive, breakFdId]);

  const handleBreakFD = useCallback(() => {
    Alert.alert(
      'Break Fixed Deposit',
      'Are you sure you want to break this Fixed Deposit? This will mark this FD as broken and add a Cash In transaction of category "FD Break" for ₹' + Number(amount).toLocaleString('en-IN') + '.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Break FD',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedOriginal = {
                amount: Number(amount),
                type,
                source,
                category,
                note: note || '',
                title: note || category || 'Transaction',
                transactionDate: date.toISOString(),
                isBroken: true,
                isActive: false,
              };
              await updateTransaction(params.id as string, updatedOriginal);

              const cashInTx = {
                amount: Number(amount),
                type: 'cash_in' as const,
                source: 'balance' as const,
                category: 'FD Break',
                note: `Broken FD: ${note || 'FD'}`,
                title: `Broken FD: ${note || 'FD'}`,
                transactionDate: new Date().toISOString(),
                isBroken: false,
                isActive: true,
              };
              await addTransaction(cashInTx);

              showToast('Fixed Deposit broken successfully', 'success');
              router.back();
            } catch (error: any) {
              showToast(error?.message || 'Failed to break Fixed Deposit', 'error');
            }
          },
        },
      ]
    );
  }, [params.id, amount, type, source, category, note, date, updateTransaction, addTransaction, showToast, router]);

  const handleToggleActive = useCallback(async () => {
    const nextActive = !isActive;
    try {
      const updated = {
        amount: Number(amount),
        type,
        source,
        category,
        note: note || '',
        title: note || category || 'Transaction',
        transactionDate: date.toISOString(),
        isBroken,
        isActive: nextActive,
      };
      await updateTransaction(params.id as string, updated);
      setIsActive(nextActive);
      showToast(
        category === 'SIP' 
          ? `SIP successfully ${nextActive ? 'resumed' : 'stopped'}` 
          : `EMI successfully marked as ${nextActive ? 'active' : 'completed'}`,
        'success'
      );
      router.back();
    } catch (error: any) {
      showToast(error?.message || 'Failed to update commitment status', 'error');
    }
  }, [params.id, amount, type, source, category, note, date, isBroken, isActive, updateTransaction, showToast, router]);

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
              { label: 'Investment', value: 'investment' as const, activeColor: colors.warning[600], shadowColor: colors.warning[600] },
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
              {filteredSuggestions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsContent}
                  style={styles.suggestionsContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionChip,
                        {
                          backgroundColor: colors.light.background,
                          borderColor: colors.light.border,
                        },
                      ]}
                      onPress={() => setNote(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.suggestionText, { color: colors.gray[600] }]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {suggestedCategory && category !== suggestedCategory && (
                <TouchableOpacity
                  style={[
                    styles.suggestionCategoryChip,
                    {
                      backgroundColor: colors.primary[50] + '12',
                      borderColor: colors.primary[600] + '30',
                    },
                  ]}
                  onPress={() => setCategory(suggestedCategory)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={12} color={colors.primary[600]} style={{ marginRight: 6 }} />
                  <Text style={[styles.suggestionCategoryText, { color: colors.primary[600] }]}>
                    Suggest category: <Text style={{ fontFamily: Typography.fontFamily.bold }}>{suggestedCategory}</Text> (Tap to apply)
                  </Text>
                </TouchableOpacity>
              )}
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

          {/* Selector for which FD is being broken */}
          {type === 'cash_in' && category === 'FD Break' && (
            <View style={[styles.fieldContainer, { marginTop: Metrics.md, paddingHorizontal: Metrics.sm }]}>
              <Text style={[styles.fieldLabel, { color: colors.gray[400], marginBottom: 8 }]}>
                SELECT FIXED DEPOSIT TO BREAK
              </Text>
              {activeFds.length === 0 ? (
                <View style={[styles.noFdsCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.warning[600]} style={{ marginRight: 6 }} />
                  <Text style={[styles.noFdsText, { color: colors.gray[500] }]}>No active Fixed Deposits found to break.</Text>
                </View>
              ) : (
                <View style={[styles.fdsListContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                  {activeFds.map((fd) => {
                    const isSelected = breakFdId === (fd._id || fd.id);
                    return (
                      <TouchableOpacity
                        key={fd._id || fd.id}
                        style={[
                          styles.fdSelectRow,
                          { borderBottomColor: colors.light.border },
                          isSelected && { backgroundColor: colors.primary[50] + '20' }
                        ]}
                        onPress={() => {
                          const targetId = fd._id || fd.id || '';
                          setBreakFdId(targetId);
                          setAmount(fd.amount.toString()); // Pre-fill amount
                          setNote(`Broken FD: ${fd.note || fd.title || 'FD'}`); // Pre-fill note
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.fdInfoRow}>
                          <Ionicons 
                            name={isSelected ? "radio-button-on" : "radio-button-off"} 
                            size={18} 
                            color={isSelected ? colors.primary[600] : colors.gray[400]} 
                            style={{ marginRight: Metrics.sm }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.fdSelectTitle, { color: colors.light.text, fontFamily: isSelected ? Typography.fontFamily.semiBold : Typography.fontFamily.regular }]}>
                              {fd.note || fd.title || 'Fixed Deposit'}
                            </Text>
                            <Text style={[styles.fdSelectSubtitle, { color: colors.gray[500] }]}>
                              Date: {new Date(fd.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          <Text style={[styles.fdSelectAmount, { color: isSelected ? colors.primary[600] : colors.light.text }]}>
                            ₹{fd.amount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

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

          {isEditMode && type === 'investment' && category === 'FD' && !isBroken && (
            <Button
              title="Break Fixed Deposit"
              onPress={handleBreakFD}
              variant="danger"
              fullWidth
              style={{ marginBottom: Metrics.sm }}
            />
          )}

          {isEditMode && ((type === 'investment' && category === 'SIP') || (type === 'cash_out' && category === 'EMI')) && (
            <Button
              title={
                category === 'SIP'
                  ? (isActive ? 'Stop SIP' : 'Resume SIP')
                  : (isActive ? 'Mark EMI as Completed' : 'Mark EMI as Active')
              }
              onPress={handleToggleActive}
              variant="outline"
              fullWidth
              style={{ marginBottom: Metrics.sm }}
            />
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
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsContent: {
    gap: 8,
    paddingVertical: 4,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
  },
  noFdsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.md,
    padding: Metrics.md,
  },
  noFdsText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
  },
  fdsListContainer: {
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.lg,
    overflow: 'hidden',
  },
  fdSelectRow: {
    padding: Metrics.md,
    borderBottomWidth: 1,
  },
  fdInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fdSelectTitle: {
    fontSize: Metrics.fontSizes.sm,
  },
  fdSelectSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  fdSelectAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.sm,
  },
  suggestionCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.md,
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.xs + 2,
    marginTop: Metrics.sm,
    alignSelf: 'flex-start',
  },
  suggestionCategoryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs + 1,
  },
});