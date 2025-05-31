import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Track Your Expenses',
    description: 'Keep track of your daily expenses and income with ease',
    image: require('@/assets/images/monthly-expenses.jpg'),
  },
  {
    id: '2',
    title: 'Set Budgets',
    description: 'Set monthly budgets and get notified when you exceed them',
    image: require('@/assets/images/set-budget.webp'),
  },
  {
    id: '3',
    title: 'Analyze Spending',
    description: 'View detailed analytics of your spending patterns',
    image: require('@/assets/images/analysis.webp'),
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/+auth/sign-in');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.light.background }]}>
      <View style={styles.slidesContainer}>
        <FlatList
          data={slides}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.light.text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.gray[600] }]}>{item.description}</Text>
              </View>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: colors.primary[600],
                },
              ]}
              key={index}
            />
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary[600] }]}
        onPress={scrollTo}
      >
        <Text style={[styles.buttonText, { color: colors.light.text }]}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <ChevronRight size={24} color={colors.light.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
  },
  image: {
    flex: 0.7,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 0.3,
    alignItems: 'center',
    padding: Metrics.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.title,
    marginBottom: Metrics.md,
    textAlign: 'center',
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Metrics.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Metrics.md,
    paddingHorizontal: Metrics.xl,
    borderRadius: Metrics.borderRadius.full,
    marginHorizontal: Metrics.xl,
    marginBottom: Metrics.xl,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
    marginRight: Metrics.xs,
  },
});