import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

interface DataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface PieChartProps {
  data: DataItem[];
  title?: string;
  height?: number;
  width?: number;
  showLegend?: boolean;
  accessor?: string;
}

export function PieChart({
  data,
  title,
  height = 220,
  width = Dimensions.get('window').width - Metrics.md * 2,
  showLegend = true,
  accessor = 'value',
}: PieChartProps) {
  const chartConfig = {
    backgroundColor: Colors.light.background,
    backgroundGradientFrom: Colors.light.background,
    backgroundGradientTo: Colors.light.background,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const chartData = data.map((item) => ({
    name: item.name,
    [accessor]: item.value,
    color: item.color,
    legendFontColor: item.legendFontColor || Colors.gray[700],
    legendFontSize: item.legendFontSize || Metrics.fontSizes.xs,
  }));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {data.length > 0 ? (
        <RNPieChart
          data={chartData}
          width={width}
          height={height}
          chartConfig={chartConfig}
          accessor={accessor}
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          hasLegend={showLegend}
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

export default PieChart;