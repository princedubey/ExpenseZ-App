import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000,
  onHide 
}: ToastProps) {
  const colors = useColors();
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Show toast
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide toast after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success[500];
      case 'error':
        return colors.error[500];
      default:
        return colors.primary[500];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  const getTopPosition = () => {
    if (Platform.OS === 'ios') {
      return 60;
    }
    return (StatusBar.currentHeight || 0) + 20;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          opacity,
          top: getTopPosition(),
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Metrics.md,
    right: Metrics.md,
    borderRadius: Metrics.borderRadius.lg,
    padding: Metrics.md,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: 'white',
    fontSize: Metrics.fontSizes.lg,
    marginRight: Metrics.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  message: {
    color: 'white',
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
    flex: 1,
  },
}); 