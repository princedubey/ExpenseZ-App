import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

interface BarChartProps {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
  title?: string;
  height?: number;
  width?: number;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  legend?: string[];
}

export function BarChart({
  labels,
  datasets,
  title,
  height = 220,
  width = Dimensions.get('window').width - Metrics.md * 2,
  yAxisSuffix = '',
  yAxisLabel = '',
  legend = [],
}: BarChartProps) {
  const chartConfig = {
    backgroundColor: Colors.light.background,
    backgroundGradientFrom: Colors.light.background,
    backgroundGradientTo: Colors.light.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => Colors.gray[600],
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary[600],
    },
    barPercentage: 0.5,
    barRadius: 4,
  };

  const data = {
    labels,
    datasets,
    legend,
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {labels.length > 0 && datasets.length > 0 && datasets[0].data.length > 0 ? (
        <RNBarChart
          data={data}
          width={width}
          height={height}
          yAxisSuffix={yAxisSuffix}
          yAxisLabel={yAxisLabel}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      ) : (
        <View style={[styles.emptyContainer, { height, width }]}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Metrics.md,
  },
  title: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.lg,
    color: Colors.gray[800],
    marginBottom: Metrics.md,
  },
  chart: {
    borderRadius: Metrics.borderRadius.md,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: Metrics.borderRadius.md,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[500],
  },
});

export default BarChart;