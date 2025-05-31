import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';

interface ProgressBarProps {
  progress: number;
  color?: string;
  style?: ViewStyle;
}

export default function ProgressBar({ progress, color, style }: ProgressBarProps) {
  const Colors = useColors();
  const barColor = color || Colors.primary[500];

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.background, { backgroundColor: Colors.gray[200] }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  background: {
    height: 8,
    borderRadius: Metrics.borderRadius.full,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: Metrics.borderRadius.full,
  },
}); 