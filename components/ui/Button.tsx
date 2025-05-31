import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const loadingColor = 
    variant === 'primary' || variant === 'danger' 
      ? Colors.light.text 
      : variant === 'outline' || variant === 'ghost'
        ? Colors.primary[600]
        : Colors.light.text;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loadingColor} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Metrics.borderRadius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary[600],
  },
  secondary: {
    backgroundColor: Colors.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error[600],
  },
  sm: {
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.xs,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: Metrics.lg,
    paddingVertical: Metrics.sm,
    minHeight: 40,
  },
  lg: {
    paddingHorizontal: Metrics.xl,
    paddingVertical: Metrics.md,
    minHeight: 48,
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.light.text,
  },
  secondaryText: {
    color: Colors.light.text,
  },
  outlineText: {
    color: Colors.primary[600],
  },
  ghostText: {
    color: Colors.primary[600],
  },
  dangerText: {
    color: Colors.light.text,
  },
  smText: {
    fontSize: Metrics.fontSizes.sm,
  },
  mdText: {
    fontSize: Metrics.fontSizes.md,
  },
  lgText: {
    fontSize: Metrics.fontSizes.lg,
  },
  disabled: {
    backgroundColor: Colors.gray[300],
    borderColor: Colors.gray[300],
    opacity: 0.7,
  },
  disabledText: {
    color: Colors.gray[500],
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: Metrics.xs,
  },
  iconRight: {
    marginLeft: Metrics.xs,
  },
});

export default Button;