import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/constants/Colors';
import { Metrics } from '@/constants/Metrics';
import { Typography } from '@/constants/Typography';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import {
  ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Landmark,
  ShieldCheck, Percent, Lightbulb, Wallet, Calendar, AlertCircle,
  Target, Zap, Award, Coffee, Home, Car,
} from 'lucide-react-native';
import { getCategoryColor } from '@/constants/Categories';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

type TabType = 'overview' | 'trends' | 'breakdown' | 'insights';

// ─── Wealth Score helper ───────────────────────────────────────────────────────
function calcWealthScore(savingsRate: number, investmentRatio: number, debtRatio: number): number {
  const s = Math.max(0, Math.min(100, savingsRate));
  const i = Math.max(0, Math.min(100, investmentRatio));
  const d = Math.max(0, Math.min(100, debtRatio));
  const raw = s * 0.45 + i * 0.35 + Math.max(0, (30 - d)) * 0.20 * (100 / 30);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

function getWealthLevel(score: number) {
  if (score >= 75) return { label: 'Excellent', emoji: '🏆', colors: ['#059669', '#10b981'] };
  if (score >= 55) return { label: 'Good', emoji: '✅', colors: ['#0284c7', '#38bdf8'] };
  if (score >= 35) return { label: 'Fair', emoji: '⚡', colors: ['#d97706', '#f59e0b'] };
  return { label: 'Needs Work', emoji: '🔔', colors: ['#dc2626', '#ef4444'] };
}

// ─── 50-30-20 helper ──────────────────────────────────────────────────────────
function get503020(income: number, expense: number, investments: number, loans: number) {
  if (income === 0) return { needs: 0, wants: 0, savings: 0 };
  const needs = Math.round((expense / income) * 100);
  const assets = Math.round(((investments + loans) / income) * 100);
  const savingsActual = Math.max(0, 100 - needs - assets);
  return { needs, assets, savings: savingsActual };
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const analytics = useStore((state) => state.analytics);
  const loading = useStore((state) => state.loading);
  const getUserAnalytics = useStore((state) => state.getUserAnalytics);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const loadAnalytics = useCallback(async () => {
    try {
      await getUserAnalytics();
    } catch (error: any) {
      showToast(error?.message || 'Failed to load analytics', 'error');
    }
  }, [getUserAnalytics, showToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
  };

  const screenWidth = Dimensions.get('window').width - Metrics.lg * 2;

  const chartConfig = {
    backgroundGradientFrom: colors.light.card,
    backgroundGradientTo: colors.light.card,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => colors.primary[500],
    labelColor: () => colors.gray[500],
    strokeWidth: 3,
    barPercentage: 0.55,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.light.card },
    propsForBackgroundLines: {
      strokeDasharray: '6 6',
      stroke: isDark ? '#2e374a' : '#edf2f7',
      strokeWidth: 1,
    },
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const totalIncome = analytics?.summary?.totalIncome || 0;
  const totalExpense = analytics?.summary?.totalExpense || 0;
  const totalInvestments = analytics?.summary?.totalInvestments || 0;
  const totalLoans = analytics?.summary?.totalLoans || 0;
  const totalInvestmentsFromBalance = analytics?.summary?.totalInvestmentsFromBalance || 0;
  const totalLoansFromBalance = analytics?.summary?.totalLoansFromBalance || 0;
  // True net balance: income - expense - cash-out investments - cash-out loans
  const netBalance = analytics?.summary?.netBalance || 0;

  // Savings = what you actually kept (income minus all real cash outflows)
  const netSavings = Math.max(0, netBalance);
  // Rates as % of income
  const expenseRate    = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const investRate     = totalIncome > 0 ? (totalInvestmentsFromBalance / totalIncome) * 100 : 0;
  const loanRate       = totalIncome > 0 ? (totalLoansFromBalance / totalIncome) * 100 : 0;
  const savingsRate    = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const investmentRatio = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const debtRatio      = totalIncome > 0 ? (totalLoans / totalIncome) * 100 : 0;

  const wealthScore = calcWealthScore(savingsRate, investmentRatio, debtRatio);
  const wealthLevel = getWealthLevel(wealthScore);

  // 50-30-20: Needs = expense%, Savings+Invest = (investRate + savingsRate)%, Debt = loanRate%
  const breakdown503020 = {
    needs:   Math.round(expenseRate),
    invest:  Math.round(investRate),
    loans:   Math.round(loanRate),
    savings: Math.round(savingsRate),
  };

  // Monthly stats for charts
  const allMonthlyStats = analytics?.monthlyStats || [];
  const nonZeroStats = allMonthlyStats.filter(
    (s) => s.income > 0 || s.expense > 0 || (s.investments ?? 0) > 0
  );
  const chartMonthlyStats = nonZeroStats.length > 0 ? nonZeroStats : allMonthlyStats;

  // Monthly savings trend (income - expense per month)
  const savingsByMonth = chartMonthlyStats.map((s) => Math.max(0, s.income - s.expense));

  // Best spending month (lowest expense among non-zero expense months)
  const expenseMonths = chartMonthlyStats.filter((s) => s.expense > 0);
  const bestMonth = expenseMonths.length > 0
    ? expenseMonths.reduce((a, b) => (a.expense < b.expense ? a : b))
    : null;
  const worstMonth = expenseMonths.length > 0
    ? expenseMonths.reduce((a, b) => (a.expense > b.expense ? a : b))
    : null;

  // Savings streak (consecutive months ending now with savings > 0)
  let savingsStreak = 0;
  for (let i = allMonthlyStats.length - 1; i >= 0; i--) {
    const s = allMonthlyStats[i];
    if (s.income > s.expense) savingsStreak++;
    else break;
  }

  // Financial level helpers
  const getSavingsLevel = () => {
    if (savingsRate >= 30) return { label: 'Excellent', color: colors.success[600], desc: 'Saving a healthy 30%+ of income.' };
    if (savingsRate >= 15) return { label: 'Healthy', color: colors.primary[500], desc: 'On track with standard advice.' };
    if (savingsRate > 0) return { label: 'Room to improve', color: colors.warning[600], desc: 'Consider trimming non-essentials.' };
    return { label: 'Overspending', color: colors.error[600], desc: 'Outflow exceeds income. Act now.' };
  };
  const getInvestmentLevel = () => {
    if (investmentRatio >= 20) return { label: 'High Allocation', color: colors.success[600] };
    if (investmentRatio >= 10) return { label: 'Moderate', color: colors.primary[500] };
    return { label: 'Low Allocation', color: colors.warning[600] };
  };
  const getDebtLevel = () => {
    if (debtRatio <= 10) return { label: 'Very Low', color: colors.success[600] };
    if (debtRatio <= 30) return { label: 'Manageable', color: colors.primary[500] };
    return { label: 'High Debt Load', color: colors.error[600] };
  };

  const savingsLevel = getSavingsLevel();
  const investmentLevel = getInvestmentLevel();
  const debtLevel = getDebtLevel();

  // Income allocation
  const allocTotal = totalIncome || 1;
  // These represent actual cash that left your pocket
  const allocExpense   = totalExpense;
  const allocInvested  = totalInvestmentsFromBalance;
  const allocLoans     = totalLoansFromBalance;
  const allocSavings   = Math.max(0, netSavings);

  // Insights list
  const getInsights = () => {
    const list: any[] = [];
    if (savingsRate < 10) {
      list.push({ icon: TrendingDown, color: colors.error[600], title: 'Low Savings Rate', message: `Your savings rate is ${savingsRate.toFixed(1)}%. Try setting category budgets to improve it.` });
    } else {
      list.push({ icon: TrendingUp, color: colors.success[600], title: 'Healthy Savings Rate', message: `You saved ${savingsRate.toFixed(1)}% of your income overall. Keep building wealth.` });
    }
    if (totalInvestments === 0) {
      list.push({ icon: ShieldCheck, color: colors.primary[500], title: 'Start Investing', message: 'No investments recorded. Allocating even 10% to mutual funds helps beat inflation.' });
    } else if (investmentRatio < 15) {
      list.push({ icon: ShieldCheck, color: colors.primary[500], title: 'Increase Asset Allocation', message: `Investing ${investmentRatio.toFixed(1)}% of income. Try reaching 15–20% for financial freedom.` });
    } else {
      list.push({ icon: Award, color: colors.success[600], title: 'Strong Investor', message: `You allocate ${investmentRatio.toFixed(1)}% of income to investments. Excellent long-term habit!` });
    }
    if (totalLoans > 0 && debtRatio > 30) {
      list.push({ icon: Landmark, color: colors.error[600], title: 'High Debt Burden', message: `Debt payments are ${debtRatio.toFixed(1)}% of income. Prioritize paying down high-interest debt.` });
    }
    if (savingsStreak > 1) {
      list.push({ icon: Zap, color: colors.warning[500], title: `${savingsStreak}-Month Savings Streak!`, message: `You've had positive savings for ${savingsStreak} consecutive months. Momentum is powerful!` });
    }
    if (bestMonth && worstMonth && bestMonth.month !== worstMonth.month) {
      list.push({ icon: Calendar, color: colors.primary[500], title: 'Spending Patterns', message: `Best month: ${formatMonth(bestMonth.month)} (${formatCurrency(bestMonth.expense)}). Highest: ${formatMonth(worstMonth.month)} (${formatCurrency(worstMonth.expense)}).` });
    }
    return list;
  };

  const insightsList = getInsights();

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderProgressBar = (pct: number, color: string, bg?: string) => (
    <View style={[styles.progressBg, { backgroundColor: bg || (isDark ? '#1e293b' : '#f1f5f9') }]}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }]} />
    </View>
  );

  const renderRatioRow = (label: string, value: number, levelColor: string, levelLabel: string, desc: string, icon: any) => {
    const Icon = icon;
    return (
      <View style={styles.ratioCard}>
        <View style={styles.ratioHeader}>
          <View style={styles.ratioTitleRow}>
            <Icon size={16} color={levelColor} style={{ marginRight: 6 }} />
            <Text style={[styles.ratioTitle, { color: colors.light.text }]}>{label}</Text>
          </View>
          <Text style={[styles.ratioValue, { color: levelColor }]}>{value.toFixed(1)}%</Text>
        </View>
        {renderProgressBar(value, levelColor)}
        <View style={styles.ratioBadgeRow}>
          <View style={[styles.ratioBadge, { backgroundColor: levelColor + '18' }]}>
            <Text style={[styles.ratioBadgeText, { color: levelColor }]}>{levelLabel}</Text>
          </View>
          <Text style={[styles.ratioDesc, { color: colors.gray[500] }]}>{desc}</Text>
        </View>
      </View>
    );
  };

  if (!analytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>Loading analytics…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAnalytics} colors={[colors.primary[600]]} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.light.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>Your complete financial picture</Text>
        </View>

        {/* ── Net Worth Hero Card ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#1e1b4b', '#311042'] : ['#0f172a', '#1e3a5f']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>NET WORTH</Text>
              <Text style={styles.heroAmount}>{formatCurrency(netBalance)}</Text>
            </View>
            <View style={[styles.wealthBadge, { backgroundColor: `${wealthLevel.colors[0]}22`, borderColor: wealthLevel.colors[0] + '55' }]}>
              <Text style={styles.wealthEmoji}>{wealthLevel.emoji}</Text>
              <Text style={[styles.wealthBadgeText, { color: '#fff' }]}>{wealthLevel.label}</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>INFLOW</Text>
              <Text style={[styles.heroStatValue, { color: '#4ade80' }]}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>OUTFLOW</Text>
              <Text style={[styles.heroStatValue, { color: '#f87171' }]}>{formatCurrency(totalExpense)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>SAVED</Text>
              <Text style={[styles.heroStatValue, { color: '#a78bfa' }]}>{savingsRate.toFixed(0)}%</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
        <View style={[styles.tabBar, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
          {(['overview', 'trends', 'breakdown', 'insights'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && { backgroundColor: colors.primary[600] }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabButtonText, { color: activeTab === tab ? '#fff' : colors.gray[500] }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* ── Wealth Score ─────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <Award size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Wealth Score</Text>
              </View>
              <View style={styles.wealthScoreRow}>
                <View style={styles.wealthScoreCircle}>
                  <LinearGradient
                    colors={wealthLevel.colors as any}
                    style={styles.wealthScoreGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.wealthScoreNumber}>{wealthScore}</Text>
                    <Text style={styles.wealthScoreOutOf}>/100</Text>
                  </LinearGradient>
                </View>
                <View style={styles.wealthScoreDetails}>
                  <Text style={[styles.wealthScoreLevel, { color: wealthLevel.colors[0] }]}>{wealthLevel.emoji} {wealthLevel.label}</Text>
                  <Text style={[styles.wealthScoreHint, { color: colors.gray[500] }]}>Based on savings rate, investment ratio, and debt load.</Text>
                  <View style={styles.wealthScoreBreakdown}>
                    {[
                      { label: 'Savings', pct: savingsRate, color: colors.success[600] },
                      { label: 'Investing', pct: investmentRatio, color: colors.primary[500] },
                      { label: 'Debt Load', pct: debtRatio, color: colors.error[500] },
                    ].map((item) => (
                      <View key={item.label} style={styles.miniStatRow}>
                        <View style={[styles.miniDot, { backgroundColor: item.color }]} />
                        <Text style={[styles.miniStatLabel, { color: colors.gray[500] }]}>{item.label}</Text>
                        <Text style={[styles.miniStatValue, { color: item.color }]}>{item.pct.toFixed(1)}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              {/* Score bar */}
              <View style={[styles.scoreBarBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <LinearGradient
                  colors={wealthLevel.colors as any}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.scoreBarFill, { width: `${wealthScore}%` }]}
                />
              </View>
              <View style={styles.scoreBarLabels}>
                <Text style={[styles.scoreBarLabel, { color: colors.gray[400] }]}>0 · Needs Work</Text>
                <Text style={[styles.scoreBarLabel, { color: colors.gray[400] }]}>100 · Excellent</Text>
              </View>
            </View>

            {/* ── Money Flow Waterfall ───────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <Wallet size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Money Flow</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Where every rupee of income goes</Text>

              {[
                { label: 'Total Income',           value: totalIncome,                pct: 100,         color: '#10b981', icon: ArrowUpRight },
                { label: 'Spent on Expenses',       value: totalExpense,               pct: expenseRate, color: '#ef4444', icon: ArrowDownLeft },
                { label: 'Invested (cash-out)',      value: totalInvestmentsFromBalance, pct: investRate,  color: '#6366f1', icon: ShieldCheck },
                { label: 'Loans & EMIs (cash-out)', value: totalLoansFromBalance,       pct: loanRate,    color: '#f59e0b', icon: Landmark },
                { label: 'Net Savings (retained)',   value: netSavings,                 pct: savingsRate, color: '#0ea5e9', icon: TrendingUp },
              ].map((row, idx) => {
                const Icon = row.icon;
                return (
                  <View key={row.label} style={[styles.flowRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.light.border }]}>
                    <View style={[styles.flowIcon, { backgroundColor: row.color + '15' }]}>
                      <Icon size={14} color={row.color} />
                    </View>
                    <View style={styles.flowContent}>
                      <View style={styles.flowTopLine}>
                        <Text style={[styles.flowLabel, { color: colors.light.text }]}>{row.label}</Text>
                        <View style={styles.flowRightGroup}>
                          <View style={[styles.flowPctBadge, { backgroundColor: row.color + '18' }]}>
                            <Text style={[styles.flowPct, { color: row.color }]}>{row.pct.toFixed(1)}%</Text>
                          </View>
                          <Text style={[styles.flowValue, { color: colors.light.text }]}>{formatCurrency(row.value)}</Text>
                        </View>
                      </View>
                      {renderProgressBar(row.pct, row.color)}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── 50-30-20 Rule ─────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <Target size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>50-30-20 Rule Analysis</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Ideal: 50% Needs · 30% Wants · 20% Savings</Text>

              {[
                {
                  label: 'Needs (Expenses)',          ideal: 50, actual: breakdown503020.needs,
                  color: '#ef4444', tip: 'Essentials: food, rent, bills',
                },
                {
                  label: 'Investments (cash-out)',     ideal: 20, actual: breakdown503020.invest,
                  color: '#6366f1', tip: 'Money deployed into assets from your balance',
                },
                {
                  label: 'Loan Repayments',            ideal: 10, actual: breakdown503020.loans,
                  color: '#f59e0b', tip: 'EMIs and loan payments made',
                },
                {
                  label: 'Net Savings (retained)',     ideal: 20, actual: breakdown503020.savings,
                  color: '#10b981', tip: 'What remains in your pocket after all outflows',
                },
              ].map((row) => {
                const delta = row.actual - row.ideal;
                const onTrack = Math.abs(delta) <= 10;
                return (
                  <View key={row.label} style={styles.ruleRow}>
                    <View style={styles.ruleTopLine}>
                      <View>
                        <Text style={[styles.ruleLabel, { color: colors.light.text }]}>{row.label}</Text>
                        <Text style={[styles.ruleTip, { color: colors.gray[400] }]}>{row.tip}</Text>
                      </View>
                      <View style={styles.ruleRight}>
                        <Text style={[styles.ruleActual, { color: row.color }]}>{row.actual}%</Text>
                        <View style={[styles.ruleDeltaBadge, { backgroundColor: onTrack ? colors.success[600] + '18' : colors.error[600] + '18' }]}>
                          <Text style={[styles.ruleDeltaText, { color: onTrack ? colors.success[600] : colors.error[600] }]}>
                            {delta >= 0 ? '+' : ''}{delta}% vs ideal
                          </Text>
                        </View>
                      </View>
                    </View>
                    {/* Dual bar: ideal vs actual */}
                    <View style={styles.dualBarContainer}>
                      <View style={[styles.dualBarBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <View style={[styles.dualBarIdeal, { width: `${row.ideal}%`, backgroundColor: row.color + '30' }]} />
                        <View style={[styles.dualBarActual, { width: `${Math.min(100, row.actual)}%`, backgroundColor: row.color }]} />
                      </View>
                      <View style={styles.dualBarLegend}>
                        <View style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: row.color + '55' }]} />
                          <Text style={[styles.legendText, { color: colors.gray[400] }]}>Ideal {row.ideal}%</Text>
                        </View>
                        <View style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: row.color }]} />
                          <Text style={[styles.legendText, { color: colors.gray[400] }]}>Actual {row.actual}%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── Income Allocation ─────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <Percent size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Income Allocation</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>How your total income is distributed</Text>

              {/* Stacked horizontal bar — based on actual cash outflows */}
              {totalIncome > 0 && (
                <View style={styles.stackedBarRow}>
                  {[
                    { label: 'Expenses', value: allocExpense,  color: '#ef4444' },
                    { label: 'Invested', value: allocInvested, color: '#6366f1' },
                    { label: 'Loans',    value: allocLoans,    color: '#f59e0b' },
                    { label: 'Savings',  value: allocSavings,  color: '#10b981' },
                  ].filter((s) => s.value > 0).map((seg) => {
                    const pct = (seg.value / allocTotal) * 100;
                    return (
                      <View
                        key={seg.label}
                        style={[styles.stackedSegment, { flex: pct, backgroundColor: seg.color }]}
                      />
                    );
                  })}
                </View>
              )}

              <View style={styles.allocationGrid}>
                {[
                  { label: 'Expenses',         value: allocExpense,  color: '#ef4444', icon: Coffee,     subLabel: 'of income' },
                  { label: 'Invested',          value: allocInvested, color: '#6366f1', icon: TrendingUp, subLabel: 'cash-out' },
                  { label: 'Loan Repayments',   value: allocLoans,    color: '#f59e0b', icon: Landmark,   subLabel: 'cash-out' },
                  { label: 'Net Savings',       value: allocSavings,  color: '#10b981', icon: ShieldCheck, subLabel: 'retained' },
                ].map((item) => {
                  const Icon = item.icon;
                  const pct = totalIncome > 0 ? ((item.value / allocTotal) * 100).toFixed(1) : '0';
                  return (
                    <View key={item.label} style={[styles.allocCard, { backgroundColor: item.color + '10', borderColor: item.color + '30' }]}>
                      <View style={[styles.allocIconBg, { backgroundColor: item.color + '20' }]}>
                        <Icon size={14} color={item.color} />
                      </View>
                      <Text style={[styles.allocPct, { color: item.color }]}>{pct}%</Text>
                      <Text style={[styles.allocLabel, { color: colors.gray[500] }]}>{item.label}</Text>
                      <Text style={[styles.allocAmount, { color: colors.light.text }]} numberOfLines={1} adjustsFontSizeToFit>
                        {formatCurrency(item.value)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Quick Stats Row ───────────────────────────────────────────── */}
            {savingsStreak > 0 && (
              <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                <View style={styles.cardTitleRow}>
                  <Zap size={18} color={colors.warning[500]} style={{ marginRight: 8 }} />
                  <Text style={[styles.cardTitle, { color: colors.light.text }]}>Milestones</Text>
                </View>
                <View style={styles.milestoneRow}>
                  <View style={[styles.milestoneCard, { backgroundColor: colors.success[600] + '12', borderColor: colors.success[600] + '30' }]}>
                    <Text style={[styles.milestoneValue, { color: colors.success[600] }]}>{savingsStreak}</Text>
                    <Text style={[styles.milestoneLabel, { color: colors.gray[500] }]}>Savings Streak (months)</Text>
                  </View>
                  {bestMonth && (
                    <View style={[styles.milestoneCard, { backgroundColor: colors.primary[500] + '12', borderColor: colors.primary[500] + '30' }]}>
                      <Text style={[styles.milestoneValue, { color: colors.primary[500] }]}>{formatMonth(bestMonth.month)}</Text>
                      <Text style={[styles.milestoneLabel, { color: colors.gray[500] }]}>Best Spending Month</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TRENDS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'trends' && (
          <>
            {/* Cash Flow Line Chart */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.cardTitle, { color: colors.light.text }]}>Cash Flow Trends</Text>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Income vs Expenses over time</Text>
              {chartMonthlyStats.length > 0 ? (
                <>
                  <LineChart
                    data={{
                      labels: chartMonthlyStats.map((s) => formatMonth(s.month)),
                      datasets: [
                        { data: chartMonthlyStats.map((s) => s.income), color: () => '#10b981', strokeWidth: 3 },
                        { data: chartMonthlyStats.map((s) => s.expense), color: () => '#ef4444', strokeWidth: 3 },
                      ],
                    }}
                    width={screenWidth}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    yAxisLabel="₹"
                    yAxisInterval={1}
                    segments={4}
                  />
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                    <Text style={[styles.legendText, { color: colors.gray[500] }]}>Income</Text>
                    <View style={[styles.legendDot, { backgroundColor: '#ef4444', marginLeft: 12 }]} />
                    <Text style={[styles.legendText, { color: colors.gray[500] }]}>Expense</Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>No trend data yet</Text>
                </View>
              )}
            </View>

            {/* Monthly Savings Bar Chart */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.cardTitle, { color: colors.light.text }]}>Monthly Savings</Text>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>How much you kept each month</Text>
              {chartMonthlyStats.length > 0 && savingsByMonth.some((v) => v > 0) ? (
                <BarChart
                  data={{
                    labels: chartMonthlyStats.map((s) => formatMonth(s.month)),
                    datasets: [{ data: savingsByMonth }],
                  }}
                  width={screenWidth}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  }}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  style={styles.chart}
                  fromZero
                  showValuesOnTopOfBars
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>No savings data yet</Text>
                </View>
              )}
            </View>

            {/* Investments line chart */}
            {chartMonthlyStats.some((s) => (s.investments ?? 0) > 0) && (
              <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Investment Trend</Text>
                <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Monthly investment activity</Text>
                <LineChart
                  data={{
                    labels: chartMonthlyStats.map((s) => formatMonth(s.month)),
                    datasets: [
                      { data: chartMonthlyStats.map((s) => s.investments ?? 0), color: () => '#6366f1', strokeWidth: 3 },
                    ],
                  }}
                  width={screenWidth}
                  height={180}
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})` }}
                  bezier
                  style={styles.chart}
                  yAxisLabel="₹"
                  segments={3}
                />
              </View>
            )}

            {/* Weekly Spending */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.cardTitle, { color: colors.light.text }]}>Weekly Spending (This Month)</Text>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Expense distribution by week</Text>
              {analytics.weeklyStats && analytics.weeklyStats.some((w) => w.total > 0) ? (
                <BarChart
                  data={{
                    labels: analytics.weeklyStats.map((w) => w.week),
                    datasets: [{ data: analytics.weeklyStats.map((w) => w.total) }],
                  }}
                  width={screenWidth}
                  height={200}
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>No weekly data this month</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            BREAKDOWN TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'breakdown' && (
          <>
            {/* Spending by Category Pie */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.cardTitle, { color: colors.light.text }]}>Spending by Category</Text>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>All-time expense breakdown</Text>
              {analytics.spendingByCategories && analytics.spendingByCategories.length > 0 ? (
                <>
                  <View style={styles.pieContainer}>
                    <PieChart
                      data={analytics.spendingByCategories.map((c) => ({
                        name: c.category,
                        amount: c.total,
                        color: getCategoryColor(c.category),
                        legendFontColor: colors.light.text,
                        legendFontSize: 12,
                      }))}
                      width={screenWidth}
                      height={200}
                      chartConfig={chartConfig}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                      hasLegend={false}
                      center={[screenWidth / 4, 0]}
                    />
                  </View>
                  <View style={styles.categoryList}>
                    {analytics.spendingByCategories.map((cat) => {
                      const pct = (cat.total / (totalExpense || 1)) * 100;
                      const c = getCategoryColor(cat.category);
                      return (
                        <View key={cat.category} style={styles.categoryItem}>
                          <View style={styles.categoryTopLine}>
                            <View style={styles.categoryInfo}>
                              <View style={[styles.categoryDot, { backgroundColor: c }]} />
                              <Text style={[styles.categoryName, { color: colors.light.text }]}>{cat.category}</Text>
                            </View>
                            <View style={styles.categoryAmounts}>
                              <View style={[styles.pctBadge, { backgroundColor: c + '18' }]}>
                                <Text style={[styles.pctBadgeText, { color: c }]}>{pct.toFixed(0)}%</Text>
                              </View>
                              <Text style={[styles.categoryAmount, { color: colors.light.text }]}>{formatCurrency(cat.total)}</Text>
                            </View>
                          </View>
                          {renderProgressBar(pct, c)}
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>No spending data available</Text>
                </View>
              )}
            </View>

            {/* Percentage-wise income allocation pie */}
            {totalIncome > 0 && (
              <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Income Allocation Pie</Text>
                <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>All income split into buckets</Text>
                <View style={styles.pieContainer}>
                  <PieChart
                    data={[
                      { name: 'Expenses',   amount: allocExpense,  color: '#ef4444', legendFontColor: colors.light.text, legendFontSize: 11 },
                      { name: 'Invested',   amount: allocInvested, color: '#6366f1', legendFontColor: colors.light.text, legendFontSize: 11 },
                      { name: 'Loans',      amount: allocLoans,    color: '#f59e0b', legendFontColor: colors.light.text, legendFontSize: 11 },
                      { name: 'Savings',    amount: allocSavings,  color: '#10b981', legendFontColor: colors.light.text, legendFontSize: 11 },
                    ].filter((d) => d.amount > 0)}
                    width={screenWidth}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    hasLegend={true}
                    center={[0, 0]}
                  />
                </View>
              </View>
            )}

            {/* Top Largest Expenses */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <AlertCircle size={18} color={colors.error[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Top Largest Expenses</Text>
              </View>
              {analytics.topTransactions && analytics.topTransactions.length > 0 ? (
                analytics.topTransactions.map((tx, idx) => (
                  <View
                    key={tx._id}
                    style={[styles.txRow, idx < analytics.topTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.light.border }]}
                  >
                    <View style={[styles.txIconBg, { backgroundColor: getCategoryColor(tx.category) + '15' }]}>
                      <Text style={{ fontFamily: Typography.fontFamily.bold, color: getCategoryColor(tx.category), fontSize: 13 }}>
                        {tx.category.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.txContent}>
                      <Text style={[styles.txTitle, { color: colors.light.text }]} numberOfLines={1}>{tx.title || tx.category}</Text>
                      <Text style={[styles.txMeta, { color: colors.gray[500] }]}>
                        {new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {tx.category}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: colors.error[600] }]}>{formatCurrency(tx.amount)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>No transactions available</Text>
                </View>
              )}
            </View>

            {/* Day of week spending */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <Calendar size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Spending by Day of Week</Text>
              </View>
              {analytics.dayOfWeekStats && analytics.dayOfWeekStats.some((d) => d.total > 0) ? (
                <BarChart
                  data={{
                    labels: analytics.dayOfWeekStats.map((d) => d.day),
                    datasets: [{ data: analytics.dayOfWeekStats.map((d) => d.total) }],
                  }}
                  width={screenWidth}
                  height={200}
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})` }}
                  yAxisLabel=""
                  yAxisSuffix=""
                  style={styles.chart}
                  withInnerLines={false}
                  showValuesOnTopOfBars={false}
                  fromZero
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>No day-of-week data</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            INSIGHTS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'insights' && (
          <>
            {/* Financial Ratios */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.cardTitle, { color: colors.light.text }]}>Financial Ratios</Text>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Key metrics vs benchmarks</Text>
              <View style={styles.ratioDivider} />
              {renderRatioRow('Savings Rate', savingsRate, savingsLevel.color, savingsLevel.label, savingsLevel.desc, Percent)}
              <View style={styles.ratioDivider} />
              {renderRatioRow('Investment Rate', investmentRatio, investmentLevel.color, investmentLevel.label, 'Target: 15–20% of income', ShieldCheck)}
              <View style={styles.ratioDivider} />
              {renderRatioRow('Debt-to-Income', debtRatio, debtLevel.color, debtLevel.label, 'Recommended: below 30%', Landmark)}
            </View>

            {/* Percentage breakdown stat cards */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.cardTitle, { color: colors.light.text }]}>Percentage Snapshot</Text>
              <Text style={[styles.cardSubtitle, { color: colors.gray[500] }]}>Your money as % of total income</Text>
              {[
                { label: 'Expense Ratio', value: expenseRate, color: '#ef4444', ideal: '≤ 50%', good: expenseRate <= 50 },
                { label: 'Investment Ratio', value: investmentRatio, color: '#6366f1', ideal: '≥ 15%', good: investmentRatio >= 15 },
                { label: 'Savings Rate', value: savingsRate, color: '#10b981', ideal: '≥ 20%', good: savingsRate >= 20 },
                { label: 'Debt Ratio', value: debtRatio, color: '#f59e0b', ideal: '≤ 30%', good: debtRatio <= 30 },
              ].map((item, idx, arr) => (
                <View key={item.label} style={[styles.snapRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.light.border }]}>
                  <View style={styles.snapLeft}>
                    <View style={[styles.snapDot, { backgroundColor: item.color }]} />
                    <View>
                      <Text style={[styles.snapLabel, { color: colors.light.text }]}>{item.label}</Text>
                      <Text style={[styles.snapIdeal, { color: colors.gray[400] }]}>Target: {item.ideal}</Text>
                    </View>
                  </View>
                  <View style={styles.snapRight}>
                    <Text style={[styles.snapValue, { color: item.color }]}>{item.value.toFixed(1)}%</Text>
                    <View style={[styles.snapStatus, { backgroundColor: item.good ? colors.success[600] + '18' : colors.error[600] + '18' }]}>
                      <Text style={[styles.snapStatusText, { color: item.good ? colors.success[600] : colors.error[600] }]}>
                        {item.good ? '✓ On track' : '⚠ Off target'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Actionable Insights */}
            <View style={[styles.card, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.cardTitleRow}>
                <Lightbulb size={18} color={colors.warning[500]} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.light.text }]}>Actionable Insights</Text>
              </View>
              {insightsList.length > 0 ? (
                insightsList.map((insight, idx) => {
                  const Icon = insight.icon;
                  return (
                    <View
                      key={idx}
                      style={[styles.insightItem, idx < insightsList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.light.border }]}
                    >
                      <View style={[styles.insightIconBg, { backgroundColor: insight.color + '15' }]}>
                        <Icon size={18} color={insight.color} />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={[styles.insightTitle, { color: colors.light.text }]}>{insight.title}</Text>
                        <Text style={[styles.insightMsg, { color: colors.gray[500] }]}>{insight.message}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.emptyStateText, { color: colors.gray[500], textAlign: 'center', paddingVertical: Metrics.md }]}>
                  Add more transactions to generate insights.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: Metrics.lg, paddingTop: Metrics.lg, paddingBottom: Metrics.sm },
  title: { fontFamily: Typography.fontFamily.bold, fontSize: Metrics.fontSizes.xl },
  subtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Metrics.fontSizes.sm, marginTop: 2 },

  // Hero card
  heroCard: {
    marginHorizontal: Metrics.lg, borderRadius: 20, padding: Metrics.md,
    marginBottom: Metrics.md, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  heroAmount: { fontFamily: Typography.fontFamily.bold, fontSize: 28, color: '#fff', marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: Metrics.md },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around' },
  heroStatItem: { alignItems: 'center', flex: 1 },
  heroStatLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2, marginBottom: 4 },
  heroStatValue: { fontFamily: Typography.fontFamily.bold, fontSize: 15 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  wealthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  wealthEmoji: { fontSize: 14 },
  wealthBadgeText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12 },

  // Tabs
  tabBar: {
    flexDirection: 'row', marginHorizontal: Metrics.lg, padding: 4,
    borderRadius: 14, borderWidth: 1, marginBottom: Metrics.md,
  },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabButtonText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 11 },

  // Card
  card: {
    marginHorizontal: Metrics.lg, borderRadius: 18, borderWidth: 1,
    padding: Metrics.md, marginBottom: Metrics.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Metrics.fontSizes.md },
  cardSubtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Metrics.fontSizes.xs, marginBottom: Metrics.md },

  // Wealth Score
  wealthScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Metrics.md },
  wealthScoreCircle: { marginRight: Metrics.md },
  wealthScoreGradient: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  wealthScoreNumber: { fontFamily: Typography.fontFamily.bold, fontSize: 26, color: '#fff' },
  wealthScoreOutOf: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  wealthScoreDetails: { flex: 1 },
  wealthScoreLevel: { fontFamily: Typography.fontFamily.bold, fontSize: 16, marginBottom: 4 },
  wealthScoreHint: { fontFamily: Typography.fontFamily.regular, fontSize: 11, lineHeight: 15, marginBottom: 8 },
  wealthScoreBreakdown: { gap: 4 },
  miniStatRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniDot: { width: 7, height: 7, borderRadius: 4 },
  miniStatLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 11, flex: 1 },
  miniStatValue: { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  scoreBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBarLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 10 },

  // Money Flow
  flowRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  flowIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  flowContent: { flex: 1 },
  flowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  flowLabel: { fontFamily: Typography.fontFamily.medium, fontSize: 13 },
  flowRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flowPctBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  flowPct: { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  flowValue: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12 },

  // 50-30-20 Rule
  ruleRow: { marginBottom: Metrics.md },
  ruleTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ruleLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13 },
  ruleTip: { fontFamily: Typography.fontFamily.regular, fontSize: 11, marginTop: 2 },
  ruleRight: { alignItems: 'flex-end', gap: 4 },
  ruleActual: { fontFamily: Typography.fontFamily.bold, fontSize: 18 },
  ruleDeltaBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  ruleDeltaText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10 },
  dualBarContainer: { gap: 4 },
  dualBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  dualBarIdeal: { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 4 },
  dualBarActual: { height: '100%', borderRadius: 4 },
  dualBarLegend: { flexDirection: 'row', gap: 12 },

  // Income allocation
  stackedBarRow: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: Metrics.md },
  stackedSegment: { height: '100%' },
  allocationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allocCard: { width: '47.5%', borderWidth: 1, borderRadius: 14, padding: 12 },
  allocIconBg: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  allocPct: { fontFamily: Typography.fontFamily.bold, fontSize: 20 },
  allocLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 11, marginTop: 2 },
  allocAmount: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12, marginTop: 4 },

  // Milestones
  milestoneRow: { flexDirection: 'row', gap: 10 },
  milestoneCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  milestoneValue: { fontFamily: Typography.fontFamily.bold, fontSize: 22, marginBottom: 4 },
  milestoneLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 11, textAlign: 'center' },

  // Charts
  chart: { marginVertical: Metrics.xs, borderRadius: 12, alignSelf: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Metrics.sm, gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontFamily: Typography.fontFamily.medium, fontSize: 11 },

  // Empty state
  emptyState: { height: 160, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontFamily.medium, fontSize: 13 },

  // Category
  pieContainer: { alignItems: 'center', marginVertical: Metrics.sm },
  categoryList: { marginTop: Metrics.sm },
  categoryItem: { marginBottom: 10 },
  categoryTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryDot: { width: 9, height: 9, borderRadius: 5 },
  categoryName: { fontFamily: Typography.fontFamily.medium, fontSize: 13 },
  categoryAmounts: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  pctBadgeText: { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  categoryAmount: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Transactions
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  txIconBg: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  txContent: { flex: 1 },
  txTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13 },
  txMeta: { fontFamily: Typography.fontFamily.regular, fontSize: 11, marginTop: 2 },
  txAmount: { fontFamily: Typography.fontFamily.bold, fontSize: 14 },

  // Ratios
  ratioCard: { paddingVertical: 10 },
  ratioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ratioTitleRow: { flexDirection: 'row', alignItems: 'center' },
  ratioTitle: { fontFamily: Typography.fontFamily.medium, fontSize: 13 },
  ratioValue: { fontFamily: Typography.fontFamily.bold, fontSize: 16 },
  ratioBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ratioBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratioBadgeText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 11 },
  ratioDesc: { fontFamily: Typography.fontFamily.regular, fontSize: 11, flex: 1 },
  ratioDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 2 },

  // Snapshot
  snapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  snapLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  snapDot: { width: 10, height: 10, borderRadius: 5 },
  snapLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13 },
  snapIdeal: { fontFamily: Typography.fontFamily.regular, fontSize: 11, marginTop: 2 },
  snapRight: { alignItems: 'flex-end', gap: 4 },
  snapValue: { fontFamily: Typography.fontFamily.bold, fontSize: 16 },
  snapStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  snapStatusText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10 },

  // Insights
  insightItem: { flexDirection: 'row', paddingVertical: 12, alignItems: 'flex-start', gap: 10 },
  insightIconBg: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  insightContent: { flex: 1 },
  insightTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13, marginBottom: 3 },
  insightMsg: { fontFamily: Typography.fontFamily.regular, fontSize: 12, lineHeight: 17 },
});