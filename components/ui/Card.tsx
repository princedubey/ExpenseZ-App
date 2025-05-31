import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
  const Colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.card }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Metrics.borderRadius.lg,
    padding: Metrics.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});