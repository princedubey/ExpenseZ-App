import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Metrics = {
  screenWidth: width,
  screenHeight: height,
  
  // Base spacing units
  baseSpacing: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Font sizes
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    heading: 32,
  },
  
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Common screen dimensions
  navigationBarHeight: 64,
  tabBarHeight: 56,
  
  // Icons
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
};

export default Metrics;