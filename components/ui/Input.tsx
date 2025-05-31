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
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import { useColors } from '@/constants/Colors';

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
  ...rest
}: InputProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);
  const colors = useColors();

  const togglePassword = () => {
    setSecureTextEntry((prev) => !prev);
  };

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle, { color: colors.gray[700] }]}>{label}</Text>
      )}
      
      <View style={[styles.inputContainer, { borderColor: error ? colors.error[500] : colors.gray[200], backgroundColor: colors.light.card }]}>
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
          placeholderTextColor={Colors.gray[400]}
          secureTextEntry={secureTextEntry}
          {...rest}
        />
        
        {isPassword ? (
          <TouchableOpacity onPress={togglePassword} style={styles.rightIcon}>
            {secureTextEntry ? (
              <Eye size={Metrics.iconSize.sm} color={Colors.gray[500]} />
            ) : (
              <EyeOff size={Metrics.iconSize.sm} color={Colors.gray[500]} />
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
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
    marginBottom: Metrics.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Metrics.borderRadius.md,
    paddingHorizontal: Metrics.md,
  },
  inputError: {
    borderColor: Colors.error[500],
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
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
    fontSize: Metrics.fontSizes.md,
  },
  error: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    marginTop: Metrics.xs,
  },
});

export default Input;