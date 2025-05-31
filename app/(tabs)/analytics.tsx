import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { getCategoryColor } from '@/constants/Categories';
import type { AnalyticsData } from '@/store/types';

export default function AnalyticsScreen() {
  const colors = useColors();
  const { showToast } = useToast();
  const analytics = useStore((state) => state.analytics);
  const loading = useStore((state) => state.loading);
  const getUserAnalytics = useStore((state) => state.getUserAnalytics);

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
    backgroundGradientFrom: colors.light.background,
    backgroundGradientTo: colors.light.background,
    color: (opacity = 1) => colors.primary[600],
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    formatYLabel: (value: string) => formatCurrency(parseInt(value)),
  };

  const screenWidth = Dimensions.get('window').width - Metrics.xl * 2;

  // Filter out months with no data
  const filteredMonthlyStats = analytics?.monthlyStats.filter(
    stat => stat.income > 0 || stat.expense > 0
  ) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.light.background }]} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAnalytics} colors={[colors.primary[600]]} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.light.text }]}>Analytics</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.light.card }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryLabel, { color: colors.gray[600] }]} numberOfLines={1}>
                Total Income
              </Text>
              <View style={[styles.iconContainer, { backgroundColor: colors.success[600] + '20' }]}>
                <ArrowUpRight size={16} color={colors.success[600]} />
              </View>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.success[600] }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(analytics?.summary.totalIncome || 0)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.light.card }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryLabel, { color: colors.gray[600] }]} numberOfLines={1}>
                Total Expense
              </Text>
              <View style={[styles.iconContainer, { backgroundColor: colors.error[600] + '20' }]}>
                <ArrowDownLeft size={16} color={colors.error[600]} />
              </View>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.error[600] }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(analytics?.summary.totalExpense || 0)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.light.card }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryLabel, { color: colors.gray[600] }]} numberOfLines={1}>
                Balance
              </Text>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[600] + '20' }]}>
                <Text style={{ color: colors.primary[600], fontSize: 12 }}>₹</Text>
              </View>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.primary[600] }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(analytics?.summary.balance || 0)}
            </Text>
          </View>
        </View>

        {/* Monthly Trends Chart */}
        <View style={[styles.chartContainer, { backgroundColor: colors.light.card }]}>
          <Text style={[styles.chartTitle, { color: colors.light.text }]}>Monthly Trends</Text>
          {filteredMonthlyStats.length > 0 ? (
            <LineChart
              data={{
                labels: filteredMonthlyStats.map((stat) => formatMonth(stat.month)),
                datasets: [
                  {
                    data: filteredMonthlyStats.map((stat) => stat.income),
                    color: () => colors.success[600],
                    strokeWidth: 2,
                  },
                  {
                    data: filteredMonthlyStats.map((stat) => stat.expense),
                    color: () => colors.error[600],
                    strokeWidth: 2,
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
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                No transaction data available
              </Text>
            </View>
          )}
        </View>

        {/* Spending by Category */}
        <View style={[styles.chartContainer, { backgroundColor: colors.light.card }]}>
          <Text style={[styles.chartTitle, { color: colors.light.text }]}>Spending by Category</Text>
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
                  height={220}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                  hasLegend={false}
                  center={[screenWidth / 4, 0]}
                />
              </View>
              <View style={styles.categoryList}>
                {analytics.spendingByCategories.map((category) => {
                  const percentage = (category.total / (analytics.summary.totalExpense || 1)) * 100;
                  return (
                    <View key={category.category} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: getCategoryColor(category.category) },
                          ]}
                        />
                        <Text style={[styles.categoryName, { color: colors.light.text }]}>
                          {category.category}
                        </Text>
                      </View>
                      <View style={styles.categoryAmountContainer}>
                        <Text style={[styles.categoryPercentage, { color: colors.gray[500] }]}>
                          {percentage.toFixed(1)}%
                        </Text>
                        <Text style={[styles.categoryAmount, { color: colors.light.text }]}>
                          {formatCurrency(category.total)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.gray[500] }]}>
                No spending data available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Metrics.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: Metrics.lg,
    paddingBottom: Metrics.md,
    gap: Metrics.xs,
  },
  summaryCard: {
    flex: 1,
    padding: Metrics.sm,
    borderRadius: Metrics.borderRadius.md,
    minWidth: 0,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.xs,
  },
  summaryLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
    flex: 1,
    marginRight: Metrics.xs,
  },
  summaryAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  chartContainer: {
    margin: Metrics.lg,
    padding: Metrics.md,
    borderRadius: Metrics.borderRadius.md,
  },
  chartTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
    marginBottom: Metrics.md,
  },
  chart: {
    marginVertical: Metrics.sm,
    borderRadius: Metrics.borderRadius.md,
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    marginTop: Metrics.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Metrics.xs,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Metrics.xs,
  },
  categoryName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  categoryAmountContainer: {
    alignItems: 'flex-end',
  },
  categoryPercentage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs,
    marginBottom: 2,
  },
  categoryAmount: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
  },
});