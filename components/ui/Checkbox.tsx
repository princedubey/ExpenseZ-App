import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Checkbox({ value, onValueChange, label, disabled }: CheckboxProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: value ? colors.primary[600] : 'transparent',
            borderColor: value ? colors.primary[600] : colors.gray[400],
          },
          disabled && styles.disabled,
        ]}
      >
        {value && <Check size={Metrics.iconSize.sm} color={colors.light.background} />}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            { color: disabled ? colors.gray[400] : colors.light.text },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    marginLeft: Metrics.xs,
  },
  disabled: {
    opacity: 0.5,
  },
}); 