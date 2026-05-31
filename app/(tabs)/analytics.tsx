import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/constants/Colors';
import { Metrics } from '@/constants/Metrics';
import { Typography } from '@/constants/Typography';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Landmark, ShieldCheck, Percent, Lightbulb, Wallet, Calendar, AlertCircle } from 'lucide-react-native';
import { getCategoryColor } from '@/constants/Categories';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

type TabType = 'trends' | 'breakdown' | 'insights';

export default function AnalyticsScreen() {
  const colors = useColors();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const analytics = useStore((state) => state.analytics);
  const loading = useStore((state) => state.loading);
  const getUserAnalytics = useStore((state) => state.getUserAnalytics);
  const [activeTab, setActiveTab] = useState<TabType>('trends');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
  };

  const chartConfig = {
    backgroundGradientFrom: colors.light.card,
    backgroundGradientTo: colors.light.card,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => colors.primary[500],
    labelColor: () => colors.gray[500],
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.light.card,
    },
    propsForBackgroundLines: {
      strokeDasharray: '6 6',
      stroke: isDark ? '#2e374a' : '#edf2f7',
      strokeWidth: 1,
    },
  };

  const screenWidth = Dimensions.get('window').width - Metrics.lg * 2;

  // Filter out months with no data
  const filteredMonthlyStats = analytics?.monthlyStats.filter(
    (stat) => 
      stat.income > 0 || 
      stat.expense > 0 || 
      ((stat.investments || 0) > 0) || 
      ((stat.loans || 0) > 0)
  ) || [];

  // Calculate Savings Rate and other KPIs
  const totalIncome = analytics?.summary.totalIncome || 0;
  const totalExpense = analytics?.summary.totalExpense || 0;
  const totalInvestments = analytics?.summary.totalInvestments || 0;
  const totalLoans = analytics?.summary.totalLoans || 0;

  const savingsAmount = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
  const investmentRatio = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const debtRatio = totalIncome > 0 ? (totalLoans / totalIncome) * 100 : 0;

  const getSavingsRateLevel = () => {
    if (savingsRate >= 30) return { label: 'Excellent', color: colors.success[600], desc: 'You are saving a substantial portion of your income.' };
    if (savingsRate >= 15) return { label: 'Healthy', color: colors.primary[500], desc: 'Good job! You are on track with standard savings advice.' };
    if (savingsRate > 0) return { label: 'Room to improve', color: colors.warning[600], desc: 'Consider trimming non-essential expenses.' };
    return { label: 'Overspending', color: colors.error[600], desc: 'Warning: Your outflow exceeds your income.' };
  };

  const getInvestmentRatioLevel = () => {
    if (investmentRatio >= 20) return { label: 'High Allocation', color: colors.success[600] };
    if (investmentRatio >= 10) return { label: 'Moderate', color: colors.primary[500] };
    return { label: 'Low Allocation', color: colors.warning[600] };
  };

  const getDebtRatioLevel = () => {
    if (debtRatio <= 10) return { label: 'Very Low', color: colors.success[600] };
    if (debtRatio <= 30) return { label: 'Manageable', color: colors.primary[500] };
    return { label: 'High Debt Load', color: colors.error[600] };
  };

  const savingsRateLevel = getSavingsRateLevel();
  const investmentLevel = getInvestmentRatioLevel();
  const debtLevel = getDebtRatioLevel();

  // Generate Insights messages
  const getInsights = () => {
    const list = [];
    if (savingsRate < 10) {
      list.push({
        type: 'warning',
        icon: TrendingDown,
        color: colors.error[600],
        title: 'Low Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Try setting budget limits on high-spend categories.`,
      });
    } else {
      list.push({
        type: 'success',
        icon: TrendingUp,
        color: colors.success[600],
        title: 'Healthy Savings Rate',
        message: `Awesome! You saved ${savingsRate.toFixed(1)}% of your income this month. Keep building your wealth.`,
      });
    }

    if (totalInvestments === 0) {
      list.push({
        type: 'info',
        icon: ShieldCheck,
        color: colors.primary[500],
        title: 'Start Investing',
        message: 'You have no investments recorded. Allocating even 10% to mutual funds or equities helps beat inflation.',
      });
    } else if (investmentRatio < 15) {
      list.push({
        type: 'info',
        icon: ShieldCheck,
        color: colors.primary[500],
        title: 'Increase Asset Allocation',
        message: `You're investing ${investmentRatio.toFixed(1)}% of your income. Increasing this to 15-20% accelerates financial freedom.`,
      });
    }

    if (totalLoans > 0 && debtRatio > 30) {
      list.push({
        type: 'danger',
        icon: Landmark,
        color: colors.error[600],
        title: 'High Debt Burden',
        message: `Your debt payments make up ${debtRatio.toFixed(1)}% of your income. Focus on paying down high-interest liabilities first.`,
      });
    }

    return list;
  };

  const insightsList = getInsights();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAnalytics} colors={[colors.primary[600]]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.light.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>Personal finance and cash flow overview</Text>
        </View>

        {/* Featured Net Worth Card */}
        <LinearGradient
          colors={isDark ? ['#1e1b4b', '#311042'] : ['#0284c7', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredCard}
        >
          <View style={styles.featuredHeader}>
            <View>
              <Text style={styles.featuredLabel}>NET WORTH</Text>
              <Text style={styles.featuredAmount}>
                {formatCurrency(analytics?.summary.balance || 0)}
              </Text>
            </View>
            <View style={styles.featuredIconContainer}>
              <Wallet size={24} color="#ffffff" />
            </View>
          </View>
          <View style={styles.featuredDivider} />
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredFooterText}>
              Savings Rate: <Text style={{ fontFamily: Typography.fontFamily.bold }}>{savingsRate.toFixed(0)}%</Text>
            </Text>
            <View style={[styles.featuredBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={styles.featuredBadgeText}>{savingsRateLevel.label}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 2x2 Spaced Grid for Metrics */}
        <View style={styles.gridContainer}>
          <View style={[styles.gridCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={styles.gridHeader}>
              <Text style={[styles.gridLabel, { color: colors.gray[500] }]}>INFLOW</Text>
              <View style={[styles.gridIconCircle, { backgroundColor: colors.success[600] + '15' }]}>
                <ArrowUpRight size={16} color={colors.success[600]} />
              </View>
            </View>
            <Text style={[styles.gridAmount, { color: colors.success[600] }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totalIncome)}
            </Text>
            <Text style={[styles.gridSubText, { color: colors.gray[400] }]}>Total earned</Text>
          </View>

          <View style={[styles.gridCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={styles.gridHeader}>
              <Text style={[styles.gridLabel, { color: colors.gray[500] }]}>OUTFLOW</Text>
              <View style={[styles.gridIconCircle, { backgroundColor: colors.error[600] + '15' }]}>
                <ArrowDownLeft size={16} color={colors.error[600]} />
              </View>
            </View>
            <Text style={[styles.gridAmount, { color: colors.error[600] }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totalExpense)}
            </Text>
            <Text style={[styles.gridSubText, { color: colors.gray[400] }]}>Total spent</Text>
          </View>

          <View style={[styles.gridCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={styles.gridHeader}>
              <Text style={[styles.gridLabel, { color: colors.gray[500] }]}>ASSETS</Text>
              <View style={[styles.gridIconCircle, { backgroundColor: colors.primary[600] + '15' }]}>
                <ShieldCheck size={16} color={colors.primary[600]} />
              </View>
            </View>
            <Text style={[styles.gridAmount, { color: colors.light.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totalInvestments)}
            </Text>
            <Text style={[styles.gridSubText, { color: colors.gray[400] }]}>Investments</Text>
          </View>

          <View style={[styles.gridCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
            <View style={styles.gridHeader}>
              <Text style={[styles.gridLabel, { color: colors.gray[500] }]}>LIABILITIES</Text>
              <View style={[styles.gridIconCircle, { backgroundColor: colors.warning[600] + '15' }]}>
                <Landmark size={16} color={colors.warning[600]} />
              </View>
            </View>
            <Text style={[styles.gridAmount, { color: colors.light.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totalLoans)}
            </Text>
            <Text style={[styles.gridSubText, { color: colors.gray[400] }]}>Loans & EMI</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabBar, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
          {(['trends', 'breakdown', 'insights'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && {
                  backgroundColor: colors.primary[600],
                },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === tab ? '#ffffff' : colors.gray[500] },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trends View */}
        {activeTab === 'trends' && (
          <>
            <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.contentTitle, { color: colors.light.text }]}>Cash Flow Trends</Text>
            {filteredMonthlyStats.length > 0 ? (
              <>
                <LineChart
                  data={{
                    labels: filteredMonthlyStats.map((stat) => formatMonth(stat.month)),
                    datasets: [
                      {
                        data: filteredMonthlyStats.map((stat) => stat.income),
                        color: () => colors.success[600],
                        strokeWidth: 3,
                      },
                      {
                        data: filteredMonthlyStats.map((stat) => stat.expense),
                        color: () => colors.error[600],
                        strokeWidth: 3,
                      },
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
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success[600] }]} />
                    <Text style={[styles.legendText, { color: colors.light.text }]}>Inflow</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.error[600] }]} />
                    <Text style={[styles.legendText, { color: colors.light.text }]}>Outflow</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                  No monthly trend data available
                </Text>
              </View>
            )}
          </View>
          
          {/* Weekly Spending Chart */}
          <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, marginTop: Metrics.md }]}>
            <Text style={[styles.contentTitle, { color: colors.light.text }]}>Weekly Spending (This Month)</Text>
            {analytics?.weeklyStats && analytics.weeklyStats.length > 0 ? (
              <BarChart
                data={{
                  labels: analytics.weeklyStats.map(w => w.week),
                  datasets: [
                    {
                      data: analytics.weeklyStats.map(w => w.total),
                    },
                  ],
                }}
                width={screenWidth}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(${parseInt(colors.error[600].slice(1,3), 16)}, ${parseInt(colors.error[600].slice(3,5), 16)}, ${parseInt(colors.error[600].slice(5,7), 16)}, ${opacity})`,
                }}
                yAxisLabel="₹"
                yAxisSuffix=""
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                  No weekly data available
                </Text>
              </View>
            )}
          </View>
        </>
        )}

        {/* Breakdown View */}
        {activeTab === 'breakdown' && (
          <>
            <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <Text style={[styles.contentTitle, { color: colors.light.text }]}>Spending Breakdown</Text>
            {analytics?.spendingByCategories && analytics.spendingByCategories.length > 0 ? (
              <>
                <View style={styles.pieChartContainer}>
                  <PieChart
                    data={analytics.spendingByCategories.map((category) => ({
                      name: category.category,
                      amount: category.total,
                      color: getCategoryColor(category.category),
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
                  {analytics.spendingByCategories.map((category) => {
                    const percentage = (category.total / (totalExpense || 1)) * 100;
                    const catColor = getCategoryColor(category.category);
                    return (
                      <View key={category.category} style={styles.categoryItem}>
                        <View style={styles.categoryTopLine}>
                          <View style={styles.categoryInfo}>
                            <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                            <Text style={[styles.categoryName, { color: colors.light.text }]}>
                              {category.category}
                            </Text>
                          </View>
                          <View style={styles.categoryAmounts}>
                            <Text style={[styles.categoryPercentage, { color: colors.gray[400] }]}>
                              {percentage.toFixed(0)}%
                            </Text>
                            <Text style={[styles.categoryAmount, { color: colors.light.text }]}>
                              {formatCurrency(category.total)}
                            </Text>
                          </View>
                        </View>
                        {/* Beautiful Linear Progress Bar */}
                        <View style={[styles.progressBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: catColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                  No spending breakdown available
                </Text>
              </View>
            )}
          </View>
          
          {/* Top 5 Transactions */}
          <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, marginTop: Metrics.md }]}>
            <View style={styles.insightsHeader}>
              <AlertCircle size={18} color={colors.error[500]} style={{ marginRight: 6 }} />
              <Text style={[styles.contentTitle, { color: colors.light.text, marginBottom: 0 }]}>Top Largest Expenses</Text>
            </View>
            {analytics?.topTransactions && analytics.topTransactions.length > 0 ? (
              analytics.topTransactions.map((tx, idx) => (
                <View key={tx._id} style={[styles.insightItem, idx < analytics.topTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.light.border }]}>
                  <View style={[styles.insightIconBg, { backgroundColor: getCategoryColor(tx.category) + '15' }]}>
                    <Text style={{ fontFamily: Typography.fontFamily.bold, color: getCategoryColor(tx.category) }}>
                      {tx.category.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightTitle, { color: colors.light.text }]} numberOfLines={1}>{tx.title || tx.category}</Text>
                    <Text style={[styles.insightMessage, { color: colors.gray[500] }]}>
                      {new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {tx.category}
                    </Text>
                  </View>
                  <Text style={[styles.categoryAmount, { color: colors.error[600] }]}>
                    {formatCurrency(tx.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                  No transactions available
                </Text>
              </View>
            )}
          </View>
        </>
        )}

        {/* Insights View */}
        {activeTab === 'insights' && (
          <View style={styles.insightsContainer}>
            {/* Health Ratios Section */}
            <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, marginBottom: Metrics.md }]}>
              <Text style={[styles.contentTitle, { color: colors.light.text, marginBottom: Metrics.sm }]}>Financial Ratios</Text>
              
              {/* Savings Rate KPI */}
              <View style={styles.ratioCard}>
                <View style={styles.ratioHeader}>
                  <View style={styles.ratioTitleRow}>
                    <Percent size={16} color={savingsRateLevel.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.ratioTitle, { color: colors.light.text }]}>Savings Rate</Text>
                  </View>
                  <Text style={[styles.ratioValue, { color: savingsRateLevel.color }]}>
                    {savingsRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginVertical: 6 }]}>
                  <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, savingsRate))}%`, backgroundColor: savingsRateLevel.color }]} />
                </View>
                <Text style={[styles.ratioDesc, { color: colors.gray[500] }]}>
                  Status: <Text style={{ color: savingsRateLevel.color, fontFamily: Typography.fontFamily.bold }}>{savingsRateLevel.label}</Text>. {savingsRateLevel.desc}
                </Text>
              </View>

              <View style={styles.ratioDivider} />

              {/* Investment Ratio KPI */}
              <View style={styles.ratioCard}>
                <View style={styles.ratioHeader}>
                  <View style={styles.ratioTitleRow}>
                    <ShieldCheck size={16} color={investmentLevel.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.ratioTitle, { color: colors.light.text }]}>Investment Rate</Text>
                  </View>
                  <Text style={[styles.ratioValue, { color: investmentLevel.color }]}>
                    {investmentRatio.toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginVertical: 6 }]}>
                  <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, investmentRatio))}%`, backgroundColor: investmentLevel.color }]} />
                </View>
                <Text style={[styles.ratioDesc, { color: colors.gray[500] }]}>
                  Status: <Text style={{ color: investmentLevel.color, fontFamily: Typography.fontFamily.bold }}>{investmentLevel.label}</Text>. Recommended: 15% or higher.
                </Text>
              </View>

              <View style={styles.ratioDivider} />

              {/* Debt to Income Ratio KPI */}
              <View style={styles.ratioCard}>
                <View style={styles.ratioHeader}>
                  <View style={styles.ratioTitleRow}>
                    <Landmark size={16} color={debtLevel.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.ratioTitle, { color: colors.light.text }]}>Debt-to-Income</Text>
                  </View>
                  <Text style={[styles.ratioValue, { color: debtLevel.color }]}>
                    {debtRatio.toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginVertical: 6 }]}>
                  <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, debtRatio))}%`, backgroundColor: debtLevel.color }]} />
                </View>
                <Text style={[styles.ratioDesc, { color: colors.gray[500] }]}>
                  Status: <Text style={{ color: debtLevel.color, fontFamily: Typography.fontFamily.bold }}>{debtLevel.label}</Text>. Recommended: below 30%.
                </Text>
              </View>
            </View>

            {/* Day of Week Chart */}
            <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border, marginBottom: Metrics.md }]}>
              <View style={styles.insightsHeader}>
                <Calendar size={18} color={colors.primary[500]} style={{ marginRight: 6 }} />
                <Text style={[styles.contentTitle, { color: colors.light.text, marginBottom: 0 }]}>Spending by Day</Text>
              </View>
              {analytics?.dayOfWeekStats && analytics.dayOfWeekStats.length > 0 ? (
                <BarChart
                  data={{
                    labels: analytics.dayOfWeekStats.map(d => d.day),
                    datasets: [
                      {
                        data: analytics.dayOfWeekStats.map(d => d.total),
                      },
                    ],
                  }}
                  width={screenWidth}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(${parseInt(colors.primary[500].slice(1,3), 16) || 0}, ${parseInt(colors.primary[500].slice(3,5), 16) || 0}, ${parseInt(colors.primary[500].slice(5,7), 16) || 0}, ${opacity})`,
                  }}
                  yAxisLabel=""
                  yAxisSuffix=""
                  style={styles.chart}
                  withInnerLines={false}
                  showValuesOnTopOfBars={false}
                  fromZero
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                    No day of week data available
                  </Text>
                </View>
              )}
            </View>

            {/* Advice List */}
            <View style={[styles.contentCard, { backgroundColor: colors.light.card, borderColor: colors.light.border }]}>
              <View style={styles.insightsHeader}>
                <Lightbulb size={18} color={colors.primary[500]} style={{ marginRight: 6 }} />
                <Text style={[styles.contentTitle, { color: colors.light.text, marginBottom: 0 }]}>Actionable Insights</Text>
              </View>
              {insightsList.length > 0 ? (
                insightsList.map((insight, idx) => {
                  const Icon = insight.icon;
                  return (
                    <View key={idx} style={[styles.insightItem, idx < insightsList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.light.border }]}>
                      <View style={[styles.insightIconBg, { backgroundColor: insight.color + '15' }]}>
                        <Icon size={18} color={insight.color} />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={[styles.insightTitle, { color: colors.light.text }]}>{insight.title}</Text>
                        <Text style={[styles.insightMessage, { color: colors.gray[500] }]}>{insight.message}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.emptyStateText, { color: colors.gray[500], textAlign: 'center', paddingVertical: Metrics.md }]}>
                  Add more transactions to generate custom insights.
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Metrics.xxl,
  },
  header: {
    paddingHorizontal: Metrics.lg,
    paddingTop: Metrics.lg,
    paddingBottom: Metrics.md,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    marginTop: 2,
  },
  featuredCard: {
    marginHorizontal: Metrics.lg,
    borderRadius: Metrics.borderRadius.xl,
    padding: Metrics.md,
    marginBottom: Metrics.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
  },
  featuredAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xxl,
    color: '#ffffff',
    marginTop: 4,
  },
  featuredIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: Metrics.borderRadius.full,
  },
  featuredDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: Metrics.md,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredFooterText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featuredBadge: {
    paddingHorizontal: Metrics.sm,
    paddingVertical: Metrics.xs,
    borderRadius: Metrics.borderRadius.sm,
  },
  featuredBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.xs,
    color: '#ffffff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Metrics.lg,
    gap: Metrics.sm,
    marginBottom: Metrics.lg,
  },
  gridCard: {
    width: '48%',
    borderRadius: Metrics.borderRadius.lg,
    borderWidth: 1,
    padding: Metrics.sm,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.xs,
  },
  gridLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  gridIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
  },
  gridSubText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Metrics.lg,
    padding: 4,
    borderRadius: Metrics.borderRadius.lg,
    borderWidth: 1,
    marginBottom: Metrics.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Metrics.sm,
    alignItems: 'center',
    borderRadius: Metrics.borderRadius.md,
  },
  tabButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  contentCard: {
    marginHorizontal: Metrics.lg,
    borderRadius: Metrics.borderRadius.xl,
    borderWidth: 1,
    padding: Metrics.md,
  },
  contentTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
    marginBottom: Metrics.md,
  },
  chart: {
    marginVertical: Metrics.xs,
    borderRadius: Metrics.borderRadius.md,
    alignSelf: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Metrics.md,
    marginTop: Metrics.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
  },
  emptyState: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Metrics.sm,
  },
  categoryList: {
    marginTop: Metrics.sm,
  },
  categoryItem: {
    marginBottom: Metrics.sm,
  },
  categoryTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  categoryName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Metrics.sm,
  },
  categoryPercentage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
  },
  categoryAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsContainer: {
    marginHorizontal: Metrics.lg,
  },
  ratioCard: {
    paddingVertical: Metrics.xs,
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  ratioValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.md,
  },
  ratioDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  ratioDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Metrics.sm,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  insightItem: {
    flexDirection: 'row',
    paddingVertical: Metrics.md,
    alignItems: 'flex-start',
  },
  insightIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Metrics.sm,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
    marginBottom: 2,
  },
  insightMessage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    lineHeight: 16,
  },
});