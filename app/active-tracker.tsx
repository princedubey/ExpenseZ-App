import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import type { Transaction } from '@/store/types';
import { getCategoryColor } from '@/constants/Categories';

type TabType = 'fd' | 'sip' | 'emi';

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'FD':
      return 'shield-checkmark';
    case 'SIP':
      return 'trending-up';
    case 'EMI':
      return 'wallet';
    default:
      return 'options-outline';
  }
};

export default function ActiveTrackerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const transactions = useStore((state) => state.transactions);
  const loading = useStore((state) => state.loading);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const addTransaction = useStore((state) => state.addTransaction);

  const [activeTab, setActiveTab] = useState<TabType>('fd');
  const [showClosed, setShowClosed] = useState(false);

  // Formatting helper
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  }, []);

  // FDs
  const fdData = useMemo(() => {
    const fds = transactions.filter(
      (t) => t.type === 'investment' && t.category === 'FD'
    );
    const active = fds.filter((t) => !t.isBroken);
    const closed = fds.filter((t) => !!t.isBroken);
    const totalAmount = active.reduce((sum, t) => sum + t.amount, 0);

    return { active, closed, totalAmount };
  }, [transactions]);

  // SIPs (Grouped by note/title)
  const sipData = useMemo(() => {
    const sips = transactions.filter(
      (t) => t.type === 'investment' && t.category === 'SIP'
    );

    // Group by unique note or title
    const groups: { [key: string]: Transaction[] } = {};
    sips.forEach((t) => {
      const key = (t.note || t.title || 'General SIP').trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const active: Transaction[] = [];
    const closed: Transaction[] = [];

    Object.keys(groups).forEach((key) => {
      // Sort by date desc
      const sorted = groups[key].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      const latest = sorted[0];
      if (latest.isActive !== false) {
        active.push(latest);
      } else {
        closed.push(latest);
      }
    });

    const totalAmount = active.reduce((sum, t) => sum + t.amount, 0);

    return { active, closed, totalAmount };
  }, [transactions]);

  // EMIs (Grouped by note/title)
  const emiData = useMemo(() => {
    const emis = transactions.filter(
      (t) => t.type === 'cash_out' && t.category === 'EMI'
    );

    const groups: { [key: string]: Transaction[] } = {};
    emis.forEach((t) => {
      const key = (t.note || t.title || 'General EMI').trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const active: Transaction[] = [];
    const closed: Transaction[] = [];

    Object.keys(groups).forEach((key) => {
      const sorted = groups[key].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      const latest = sorted[0];
      if (latest.isActive !== false) {
        active.push(latest);
      } else {
        closed.push(latest);
      }
    });

    const totalAmount = active.reduce((sum, t) => sum + t.amount, 0);

    return { active, closed, totalAmount };
  }, [transactions]);

  // Break FD Action
  const handleBreakFD = useCallback((t: Transaction) => {
    const fdId = t._id || t.id || '';
    const encodedNote = encodeURIComponent(`Broken FD: ${t.note || t.title || 'FD'}`);
    router.push(`/(modals)/transactions/add?type=cash_in&category=FD%20Break&amount=${t.amount}&breakFdId=${fdId}&note=${encodedNote}`);
  }, [router]);

  // Toggle Active/Inactive status for SIP/EMI
  const handleToggleStatus = useCallback(async (t: Transaction, categoryType: 'SIP' | 'EMI') => {
    const nextActive = t.isActive === false; // If currently false, toggle to true
    const actionLabel = categoryType === 'SIP'
      ? (nextActive ? 'resume' : 'stop')
      : (nextActive ? 'reactivate' : 'complete');

    Alert.alert(
      categoryType === 'SIP' ? 'Toggle SIP Commitment' : 'Toggle EMI Commitment',
      `Are you sure you want to ${actionLabel} this ${categoryType === 'SIP' ? 'SIP commitment' : 'EMI payment'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Activate' : 'Deactivate',
          onPress: async () => {
            try {
              const updated = {
                ...t,
                isActive: nextActive,
                updatedAt: new Date().toISOString(),
              };
              const { _id, user, createdAt, ...updatePayload } = updated as any;
              await updateTransaction(t._id || t.id || '', updatePayload);
              
              showToast(
                categoryType === 'SIP'
                  ? `SIP successfully ${nextActive ? 'resumed' : 'stopped'}`
                  : `EMI successfully marked as ${nextActive ? 'active' : 'completed'}`,
                'success'
              );
            } catch (error: any) {
              showToast(error?.message || 'Failed to update commitment status', 'error');
            }
          },
        },
      ]
    );
  }, [updateTransaction, showToast]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.light.border }]}>
        <TouchableOpacity
          style={[styles.headerCircleButton, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back-outline" size={20} color={colors.light.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.light.text }]}>FD, EMI & SIP Tracker</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Commitment Hero Metric Overview Grid */}
        <View style={styles.metricsGrid}>
          {/* Active FDs Card */}
          <View style={[styles.metricCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={[styles.metricIconCircle, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary[600]} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.gray[500] }]}>ACTIVE FDs</Text>
            <Text style={[styles.metricValue, { color: colors.light.text }]}>
              {formatCurrency(fdData.totalAmount)}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.gray[400] }]}>
              {fdData.active.length} active deposits
            </Text>
          </View>

          {/* Monthly SIPs Card */}
          <View style={[styles.metricCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={[styles.metricIconCircle, { backgroundColor: colors.warning[50] }]}>
              <Ionicons name="trending-up" size={18} color={colors.warning[600]} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.gray[500] }]}>MONTHLY SIP</Text>
            <Text style={[styles.metricValue, { color: colors.light.text }]}>
              {formatCurrency(sipData.totalAmount)}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.gray[400] }]}>
              {sipData.active.length} active plans
            </Text>
          </View>

          {/* Monthly EMIs Card */}
          <View style={[styles.metricCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={[styles.metricIconCircle, { backgroundColor: colors.error[50] }]}>
              <Ionicons name="wallet" size={18} color={colors.error[600]} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.gray[500] }]}>MONTHLY EMI</Text>
            <Text style={[styles.metricValue, { color: colors.light.text }]}>
              {formatCurrency(emiData.totalAmount)}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.gray[400] }]}>
              {emiData.active.length} active EMIs
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
          {[
            { label: 'Fixed Deposits', value: 'fd' as TabType },
            { label: 'SIPs', value: 'sip' as TabType },
            { label: 'EMIs', value: 'emi' as TabType },
          ].map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.tabButton,
                  isActive && { backgroundColor: colors.primary[600] }
                ]}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: isActive ? '#ffffff' : colors.gray[500],
                      fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                    }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Toggles for Closed/Stopped/Completed Items */}
        <View style={styles.toggleRow}>
          <Text style={[styles.sectionTitle, { color: colors.light.text }]}>
            {activeTab === 'fd' ? 'Fixed Deposits' : activeTab === 'sip' ? 'SIP Commitments' : 'EMI Commitments'}
          </Text>
          <TouchableOpacity
            style={[styles.toggleClosedButton, { borderColor: colors.light.border }]}
            onPress={() => setShowClosed(!showClosed)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showClosed ? "eye" : "eye-off"} 
              size={14} 
              color={colors.primary[600]} 
              style={{ marginRight: 4 }} 
            />
            <Text style={[styles.toggleClosedText, { color: colors.primary[600] }]}>
              {showClosed ? 'Hide Closed' : 'Show Closed'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Lists */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary[600]} style={{ marginTop: Metrics.xl }} />
        ) : (
          <View style={styles.listContainer}>
            {activeTab === 'fd' && (
              <>
                {fdData.active.length === 0 && (!showClosed || fdData.closed.length === 0) && (
                  <EmptyState text="No active Fixed Deposits found." colors={colors} />
                )}
                {/* Active FDs */}
                {fdData.active.map((t) => {
                  const catColor = getCategoryColor('FD');
                  const isNegative = t.type === 'cash_out' || t.type === 'loan' || (t.type === 'investment' && t.source !== 'existing');
                  return (
                    <View key={t._id || t.id} style={[styles.commitmentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                      <View style={styles.transactionContent}>
                        {/* Category Icon Circle */}
                        <View style={[styles.iconCircle, { backgroundColor: catColor + '12' }]}>
                          <Ionicons name={getCategoryIcon('FD') as any} size={20} color={catColor} />
                        </View>

                        {/* Mid Section */}
                        <View style={styles.midBlock}>
                          <Text style={[styles.transactionTitle, { color: colors.light.text }]} numberOfLines={2}>
                            {t.note || t.title || 'Fixed Deposit'}
                          </Text>
                          <View style={styles.metaRow}>
                            <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                              {formatDate(t.transactionDate)}
                            </Text>
                            {t.source && t.source.toLowerCase() !== 'balance' && (
                              <View style={[styles.sourceBadge, { backgroundColor: colors.primary[600] + '10' }]}>
                                <Text style={[styles.sourceBadgeText, { color: colors.primary[600] }]}>
                                  {t.source.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Amount Section */}
                        <View style={styles.amountBlock}>
                          <Text
                            style={[
                              styles.transactionAmount,
                              {
                                color: t.type === 'investment'
                                  ? colors.warning[600]
                                  : t.type === 'loan'
                                  ? colors.accent[600]
                                  : t.type === 'cash_out'
                                  ? colors.error[600]
                                  : colors.success[600],
                              },
                            ]}
                          >
                            {isNegative ? '-' : '+'}
                            {formatCurrency(t.amount)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.commitmentActions}>
                        <TouchableOpacity
                          style={[styles.editButton, { borderColor: colors.light.border }]}
                          onPress={() => router.push(`/(modals)/transactions/add?id=${t._id || t.id}`)}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.gray[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.gray[600] }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.breakActionButton, { backgroundColor: colors.error[50] + '15', borderColor: colors.error[600] + '20' }]}
                          onPress={() => handleBreakFD(t)}
                        >
                          <Ionicons name="close-circle-outline" size={14} color={colors.error[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.error[600] }]}>Break FD</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {/* Closed FDs */}
                {showClosed && fdData.closed.map((t) => {
                  const isNegative = t.type === 'cash_out' || t.type === 'loan' || (t.type === 'investment' && t.source !== 'existing');
                  return (
                    <View key={t._id || t.id} style={[styles.commitmentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, opacity: 0.65 }]}>
                      <View style={styles.transactionContent}>
                        {/* Category Icon Circle */}
                        <View style={[styles.iconCircle, { backgroundColor: colors.gray[100] }]}>
                          <Ionicons name={getCategoryIcon('FD') as any} size={20} color={colors.gray[400]} />
                        </View>

                        {/* Mid Section */}
                        <View style={styles.midBlock}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={[styles.transactionTitle, { color: colors.gray[400], marginRight: Metrics.sm, textDecorationLine: 'line-through' }]} numberOfLines={2}>
                              {t.note || t.title || 'Fixed Deposit'}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
                              <Text style={[styles.badgeText, { color: '#ef4444' }]}>FD Breaked</Text>
                            </View>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                              {formatDate(t.transactionDate)}
                            </Text>
                            {t.source && t.source.toLowerCase() !== 'balance' && (
                              <View style={[styles.sourceBadge, { backgroundColor: colors.gray[200] }]}>
                                <Text style={[styles.sourceBadgeText, { color: colors.gray[500] }]}>
                                  {t.source.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Amount Section */}
                        <View style={styles.amountBlock}>
                          <Text style={[styles.transactionAmount, { color: colors.gray[400], textDecorationLine: 'line-through' }]}>
                            {isNegative ? '-' : '+'}
                            {formatCurrency(t.amount)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {activeTab === 'sip' && (
              <>
                {sipData.active.length === 0 && (!showClosed || sipData.closed.length === 0) && (
                  <EmptyState text="No active SIP commitments found." colors={colors} />
                )}
                {/* Active SIPs */}
                {sipData.active.map((t) => {
                  const catColor = getCategoryColor('SIP');
                  const isNegative = t.type === 'cash_out' || t.type === 'loan' || (t.type === 'investment' && t.source !== 'existing');
                  return (
                    <View key={t._id || t.id} style={[styles.commitmentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                      <View style={styles.transactionContent}>
                        {/* Category Icon Circle */}
                        <View style={[styles.iconCircle, { backgroundColor: catColor + '12' }]}>
                          <Ionicons name={getCategoryIcon('SIP') as any} size={20} color={catColor} />
                        </View>

                        {/* Mid Section */}
                        <View style={styles.midBlock}>
                          <Text style={[styles.transactionTitle, { color: colors.light.text }]} numberOfLines={2}>
                            {t.note || t.title || 'SIP Commitment'}
                          </Text>
                          <View style={styles.metaRow}>
                            <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                              {formatDate(t.transactionDate)}
                            </Text>
                            {t.source && t.source.toLowerCase() !== 'balance' && (
                              <View style={[styles.sourceBadge, { backgroundColor: colors.primary[600] + '10' }]}>
                                <Text style={[styles.sourceBadgeText, { color: colors.primary[600] }]}>
                                  {t.source.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Amount Section */}
                        <View style={styles.amountBlock}>
                          <Text
                            style={[
                              styles.transactionAmount,
                              {
                                color: t.type === 'investment'
                                  ? colors.warning[600]
                                  : t.type === 'loan'
                                  ? colors.accent[600]
                                  : t.type === 'cash_out'
                                  ? colors.error[600]
                                  : colors.success[600],
                              },
                            ]}
                          >
                            {isNegative ? '-' : '+'}
                            {formatCurrency(t.amount)}/mo
                          </Text>
                        </View>
                      </View>
                      <View style={styles.commitmentActions}>
                        <TouchableOpacity
                          style={[styles.editButton, { borderColor: colors.light.border }]}
                          onPress={() => router.push(`/(modals)/transactions/add?id=${t._id || t.id}`)}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.gray[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.gray[600] }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.breakActionButton, { borderColor: colors.warning[600] + '30' }]}
                          onPress={() => handleToggleStatus(t, 'SIP')}
                        >
                          <Ionicons name="pause-circle-outline" size={14} color={colors.warning[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.warning[600] }]}>Stop SIP</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {/* Stopped SIPs */}
                {showClosed && sipData.closed.map((t) => {
                  const isNegative = t.type === 'cash_out' || t.type === 'loan' || (t.type === 'investment' && t.source !== 'existing');
                  return (
                    <View key={t._id || t.id} style={[styles.commitmentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, opacity: 0.65 }]}>
                      <View style={styles.transactionContent}>
                        {/* Category Icon Circle */}
                        <View style={[styles.iconCircle, { backgroundColor: colors.gray[100] }]}>
                          <Ionicons name={getCategoryIcon('SIP') as any} size={20} color={colors.gray[400]} />
                        </View>

                        {/* Mid Section */}
                        <View style={styles.midBlock}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={[styles.transactionTitle, { color: colors.gray[400], marginRight: Metrics.sm, textDecorationLine: 'line-through' }]} numberOfLines={2}>
                              {t.note || t.title || 'SIP Commitment'}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                              <Text style={[styles.badgeText, { color: '#d97706' }]}>SIP Stopped</Text>
                            </View>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                              {formatDate(t.transactionDate)}
                            </Text>
                            {t.source && t.source.toLowerCase() !== 'balance' && (
                              <View style={[styles.sourceBadge, { backgroundColor: colors.gray[200] }]}>
                                <Text style={[styles.sourceBadgeText, { color: colors.gray[500] }]}>
                                  {t.source.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Amount Section */}
                        <View style={styles.amountBlock}>
                          <Text style={[styles.transactionAmount, { color: colors.gray[400], textDecorationLine: 'line-through' }]}>
                            {isNegative ? '-' : '+'}
                            {formatCurrency(t.amount)}/mo
                          </Text>
                        </View>
                      </View>
                      <View style={styles.commitmentActions}>
                        <TouchableOpacity
                          style={[styles.editButton, { borderColor: colors.light.border }]}
                          onPress={() => router.push(`/(modals)/transactions/add?id=${t._id || t.id}`)}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.gray[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.gray[600] }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.breakActionButton, { borderColor: colors.primary[600] + '30' }]}
                          onPress={() => handleToggleStatus(t, 'SIP')}
                        >
                          <Ionicons name="play-circle-outline" size={14} color={colors.primary[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.primary[600] }]}>Resume SIP</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {activeTab === 'emi' && (
              <>
                {emiData.active.length === 0 && (!showClosed || emiData.closed.length === 0) && (
                  <EmptyState text="No active EMI commitments found." colors={colors} />
                )}
                {/* Active EMIs */}
                {emiData.active.map((t) => {
                  const catColor = getCategoryColor('EMI');
                  const isNegative = t.type === 'cash_out' || t.type === 'loan' || (t.type === 'investment' && t.source !== 'existing');
                  return (
                    <View key={t._id || t.id} style={[styles.commitmentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                      <View style={styles.transactionContent}>
                        {/* Category Icon Circle */}
                        <View style={[styles.iconCircle, { backgroundColor: catColor + '12' }]}>
                          <Ionicons name={getCategoryIcon('EMI') as any} size={20} color={catColor} />
                        </View>

                        {/* Mid Section */}
                        <View style={styles.midBlock}>
                          <Text style={[styles.transactionTitle, { color: colors.light.text }]} numberOfLines={2}>
                            {t.note || t.title || 'EMI Commitment'}
                          </Text>
                          <View style={styles.metaRow}>
                            <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                              {formatDate(t.transactionDate)}
                            </Text>
                            {t.source && t.source.toLowerCase() !== 'balance' && (
                              <View style={[styles.sourceBadge, { backgroundColor: colors.primary[600] + '10' }]}>
                                <Text style={[styles.sourceBadgeText, { color: colors.primary[600] }]}>
                                  {t.source.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Amount Section */}
                        <View style={styles.amountBlock}>
                          <Text
                            style={[
                              styles.transactionAmount,
                              {
                                color: t.type === 'investment'
                                  ? colors.warning[600]
                                  : t.type === 'loan'
                                  ? colors.accent[600]
                                  : t.type === 'cash_out'
                                  ? colors.error[600]
                                  : colors.success[600],
                              },
                            ]}
                          >
                            {isNegative ? '-' : '+'}
                            {formatCurrency(t.amount)}/mo
                          </Text>
                        </View>
                      </View>
                      <View style={styles.commitmentActions}>
                        <TouchableOpacity
                          style={[styles.editButton, { borderColor: colors.light.border }]}
                          onPress={() => router.push(`/(modals)/transactions/add?id=${t._id || t.id}`)}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.gray[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.gray[600] }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.breakActionButton, { borderColor: colors.success[600] + '30' }]}
                          onPress={() => handleToggleStatus(t, 'EMI')}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color={colors.success[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.success[600] }]}>Finish EMI</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {/* Completed EMIs */}
                {showClosed && emiData.closed.map((t) => {
                  const isNegative = t.type === 'cash_out' || t.type === 'loan' || (t.type === 'investment' && t.source !== 'existing');
                  return (
                    <View key={t._id || t.id} style={[styles.commitmentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, opacity: 0.65 }]}>
                      <View style={styles.transactionContent}>
                        {/* Category Icon Circle */}
                        <View style={[styles.iconCircle, { backgroundColor: colors.gray[100] }]}>
                          <Ionicons name={getCategoryIcon('EMI') as any} size={20} color={colors.gray[400]} />
                        </View>

                        {/* Mid Section */}
                        <View style={styles.midBlock}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={[styles.transactionTitle, { color: colors.gray[400], marginRight: Metrics.sm, textDecorationLine: 'line-through' }]} numberOfLines={2}>
                              {t.note || t.title || 'EMI Commitment'}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                              <Text style={[styles.badgeText, { color: '#16a34a' }]}>EMI Completed</Text>
                            </View>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={[styles.transactionDate, { color: colors.gray[400] }]}>
                              {formatDate(t.transactionDate)}
                            </Text>
                            {t.source && t.source.toLowerCase() !== 'balance' && (
                              <View style={[styles.sourceBadge, { backgroundColor: colors.gray[200] }]}>
                                <Text style={[styles.sourceBadgeText, { color: colors.gray[500] }]}>
                                  {t.source.toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Amount Section */}
                        <View style={styles.amountBlock}>
                          <Text style={[styles.transactionAmount, { color: colors.gray[400], textDecorationLine: 'line-through' }]}>
                            {isNegative ? '-' : '+'}
                            {formatCurrency(t.amount)}/mo
                          </Text>
                        </View>
                      </View>
                      <View style={styles.commitmentActions}>
                        <TouchableOpacity
                          style={[styles.editButton, { borderColor: colors.light.border }]}
                          onPress={() => router.push(`/(modals)/transactions/add?id=${t._id || t.id}`)}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.gray[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.gray[600] }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.breakActionButton, { borderColor: colors.primary[600] + '30' }]}
                          onPress={() => handleToggleStatus(t, 'EMI')}
                        >
                          <Ionicons name="refresh-circle-outline" size={14} color={colors.primary[600]} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionButtonText, { color: colors.primary[600] }]}>Mark Active</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-component for Empty State
function EmptyState({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={48} color={colors.gray[300]} style={{ marginBottom: Metrics.md }} />
      <Text style={[styles.emptyText, { color: colors.gray[400] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  scrollContent: {
    padding: Metrics.lg,
    gap: Metrics.lg,
    paddingBottom: Metrics.xxl * 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Metrics.sm,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.lg,
    padding: Metrics.sm + 2,
    alignItems: 'flex-start',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Metrics.xs,
  },
  metricLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 8,
    letterSpacing: 1,
  },
  metricValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md + 1,
  },
  metricSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 9,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.full,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Metrics.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrics.borderRadius.full,
  },
  tabButtonText: {
    fontSize: Metrics.fontSizes.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Metrics.xs,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
  },
  toggleClosedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toggleClosedText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
  },
  listContainer: {
    gap: Metrics.md,
  },
  commitmentCard: {
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.xl,
    padding: Metrics.md,
    gap: Metrics.md,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  commitmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Metrics.md,
  },
  commitmentTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
  commitmentSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 2,
  },
  commitmentAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
  },
  commitmentActions: {
    flexDirection: 'row',
    gap: Metrics.sm,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Metrics.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  breakActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
  },
  brokenBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brokenBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 9,
    color: '#ef4444',
  },
  stoppedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stoppedBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 9,
    color: '#d97706',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 9,
    color: '#16a34a',
  },
  emptyContainer: {
    paddingVertical: Metrics.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Metrics.md,
  },
  midBlock: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  transactionDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
  },
  sourceBadge: {
    paddingHorizontal: Metrics.xs + 2,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Metrics.sm,
    alignSelf: 'center',
  },
  badgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 9,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md - 1,
  },
});
