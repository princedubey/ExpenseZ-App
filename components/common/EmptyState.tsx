import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Metrics.xl,
    backgroundColor: Colors.light.background,
  },
  iconContainer: {
    marginBottom: Metrics.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.xl,
    color: Colors.gray[800],
    marginBottom: Metrics.sm,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Metrics.xl,
  },
  button: {
    minWidth: 140,
  },
});

export default EmptyState;