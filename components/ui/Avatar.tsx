import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';

interface AvatarProps {
  uri?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export default function Avatar({ uri, initials, size = 'md', style }: AvatarProps) {
  const Colors = useColors();

  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const fontSizeMap = {
    sm: Metrics.fontSizes.sm,
    md: Metrics.fontSizes.md,
    lg: Metrics.fontSizes.lg,
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeMap[size],
          height: sizeMap[size],
          backgroundColor: Colors.gray[100],
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: fontSizeMap[size],
              color: Colors.gray[700],
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Metrics.borderRadius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontFamily: Typography.fontFamily.semiBold,
  },
});