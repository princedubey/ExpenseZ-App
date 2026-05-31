import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Metrics } from '@/constants/Metrics';
import { Typography } from '@/constants/Typography';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
  fullWidth?: boolean;
  prefix?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  labelStyle,
  inputStyle,
  isPassword = false,
  fullWidth = true,
  prefix,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);
  const colors = useColors();
  const { isDark } = useTheme();

  const togglePassword = () => {
    setSecureTextEntry((prev) => !prev);
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle, { color: colors.gray[600] }]}>{label}</Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isFocused 
              ? (isDark ? '#0f172a' : '#ffffff') 
              : (isDark ? '#1e293b' : '#f8fafc'),
            borderColor: error 
              ? colors.error[500] 
              : isFocused 
                ? colors.primary[500] 
                : (isDark ? '#334155' : '#e2e8f0'),
            shadowColor: colors.primary[500],
            shadowOpacity: isFocused ? 0.12 : 0,
            shadowRadius: isFocused ? 8 : 0,
            shadowOffset: isFocused ? { width: 0, height: 3 } : { width: 0, height: 0 },
            elevation: isFocused ? 3 : 0,
          },
        ]}
      >
        {prefix && (
          <Text style={[styles.prefix, { color: colors.gray[500] }]}>
            {prefix}
          </Text>
        )}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : null,
            inputStyle,
            { color: colors.light.text },
            prefix && styles.inputWithPrefix,
          ]}
          placeholderTextColor={colors.light.placeholder}
          selectionColor={colors.primary[500]}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        
        {isPassword ? (
          <TouchableOpacity onPress={togglePassword} style={styles.rightIcon}>
            {secureTextEntry ? (
              <Eye size={Metrics.iconSize.sm} color={colors.gray[500]} />
            ) : (
              <EyeOff size={Metrics.iconSize.sm} color={colors.gray[500]} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      
      {error && <Text style={[styles.error, { color: colors.error[500] }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Metrics.md,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xs + 1,
    marginBottom: Metrics.xs + 2,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.lg,
    paddingHorizontal: Metrics.md,
    height: 48,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm + 1,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  inputWithLeftIcon: {
    paddingLeft: Metrics.xs,
  },
  inputWithRightIcon: {
    paddingRight: Metrics.xs,
  },
  leftIcon: {
    marginRight: Metrics.xs,
  },
  rightIcon: {
    marginLeft: Metrics.xs,
  },
  inputWithPrefix: {
    marginLeft: Metrics.xs,
  },
  prefix: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm + 1,
  },
  error: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.xs + 1,
    marginTop: Metrics.xs,
  },
});

export default Input;