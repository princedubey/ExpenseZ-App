import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Button from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again later.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <AlertTriangle
        size={Metrics.iconSize.xl}
        color={Colors.error[500]}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
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
  icon: {
    marginBottom: Metrics.md,
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

export default ErrorState;