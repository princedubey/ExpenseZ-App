import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.container, styles[variant], styles[size], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrics.borderRadius.full,
  },
  default: {
    backgroundColor: Colors.gray[200],
  },
  primary: {
    backgroundColor: Colors.primary[100],
  },
  secondary: {
    backgroundColor: Colors.secondary[100],
  },
  success: {
    backgroundColor: Colors.success[100],
  },
  warning: {
    backgroundColor: Colors.warning[100],
  },
  error: {
    backgroundColor: Colors.error[100],
  },
  sm: {
    paddingHorizontal: Metrics.sm,
    paddingVertical: Metrics.xs / 2,
  },
  md: {
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.xs,
  },
  lg: {
    paddingHorizontal: Metrics.lg,
    paddingVertical: Metrics.sm,
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
  },
  defaultText: {
    color: Colors.gray[700],
  },
  primaryText: {
    color: Colors.primary[700],
  },
  secondaryText: {
    color: Colors.secondary[700],
  },
  successText: {
    color: Colors.success[700],
  },
  warningText: {
    color: Colors.warning[700],
  },
  errorText: {
    color: Colors.error[700],
  },
  smText: {
    fontSize: Metrics.fontSizes.xs,
  },
  mdText: {
    fontSize: Metrics.fontSizes.sm,
  },
  lgText: {
    fontSize: Metrics.fontSizes.md,
  },
  icon: {
    marginRight: Metrics.xs,
  },
});

export default Badge;