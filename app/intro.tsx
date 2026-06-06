import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, Wallet, PiggyBank, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';

type IntroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: readonly [string, string];
  stats: string[];
  bullets: string[];
};

const slides: IntroSlide[] = [
  {
    id: '1',
    eyebrow: 'Speed',
    title: 'Frictionless Logging',
    description: 'Instantly capture cash flow. Intelligent categorization keeps your financial story relentlessly accurate.',
    icon: Wallet,
    accent: ['#e11d48', '#881337'],
    stats: ['Lightning fast', 'Smart auto-fill'],
    bullets: ['Log without slowing down', 'Maintain perfect context'],
  },
  {
    id: '2',
    eyebrow: 'Intelligence',
    title: 'Proactive Budgets',
    description: 'Dynamic limits that adapt to your lifestyle. Detect spending anomalies before they escalate.',
    icon: PiggyBank,
    accent: ['#f43f5e', '#be123c'],
    stats: ['Real-time caps', 'Risk alerts'],
    bullets: ['Defend your wealth', 'See anomalies instantly'],
  },
  {
    id: '3',
    eyebrow: 'Vision',
    title: 'Predictive Analytics',
    description: 'High-signal insights into the future of your money. Visualize complex trends with absolute clarity.',
    icon: BarChart3,
    accent: ['#fda4af', '#e11d48'],
    stats: ['Deep visual data', 'Future forecasts'],
    bullets: ['Predict behavior changes', 'Measure total flow'],
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList<IntroSlide>>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isCompact = height < 740;
  const heroTitleSize = isCompact ? 26 : 30;
  const heroTitleLineHeight = isCompact ? 32 : 36;
  const heroSubtitleSize = isCompact ? Metrics.fontSizes.xs : Metrics.fontSizes.sm;
  const heroSubtitleLineHeight = isCompact ? 20 : 22;
  const cardMinHeight = isCompact ? 300 : 340;
  const cardPadding = isCompact ? Metrics.md : Metrics.lg;

  useEffect(() => {
    const listenerId = scrollX.addListener(({ value }) => {
      setCurrentIndex(Math.round(value / width));
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: 12000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      scrollX.removeListener(listenerId);
    };
  }, [scrollX]);

  const scrollTo = async () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToOffset({
        offset: (currentIndex + 1) * width,
        animated: true,
      });
      return;
    }

    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding completion state:', e);
    }
    router.replace('/+auth/sign-in');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
      <LinearGradient
        colors={isDark ? ['#050505', '#110a0e', '#090507'] : ['#ffffff', '#fff1f2', '#ffe4e6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGlow}
      />

      <Animated.View
        style={[
          styles.orbLarge,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbSmall,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
              {
                rotate: orbitAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />

      <View style={[styles.header, { paddingTop: insets.top + (isCompact ? Metrics.xs : Metrics.md), paddingBottom: isCompact ? Metrics.xs : Metrics.sm }]}>
        <Text style={[styles.kicker, { color: isDark ? '#fecdd3' : '#e11d48' }]}>Next-gen financial core</Text>
        <Text
          style={[
            styles.heroTitle,
            {
              color: isDark ? '#ffffff' : '#111827',
              fontSize: heroTitleSize,
              lineHeight: heroTitleLineHeight,
            },
          ]}
        >
          Absolute control. Infinite clarity.
        </Text>
        <Text
          style={[
            styles.heroSubtitle,
            {
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(17, 24, 39, 0.7)',
              fontSize: heroSubtitleSize,
              lineHeight: heroSubtitleLineHeight,
            },
          ]}
        >
          ExpenseZ harnesses high-frequency data to give you a live, predictive view of your cash flow so you can act instantly.
        </Text>
        <View style={styles.heroPills}>
          {['Neural sync', 'Live intelligence'].map((pill) => (
            <View key={pill} style={[styles.heroPill, { 
              backgroundColor: isDark ? 'rgba(20, 10, 15, 0.65)' : 'rgba(255, 241, 242, 0.8)',
              borderColor: isDark ? 'rgba(225, 29, 72, 0.3)' : 'rgba(225, 29, 72, 0.2)'
            }]}>
              <Text style={[styles.heroPillText, { color: isDark ? '#ffe4e6' : '#e11d48' }]}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.slidesContainer}>
        <FlatList
          data={slides}
          renderItem={({ item }) => {
            const ServiceIcon = item.icon;

            return (
              <View style={[styles.slide, { width }]}> 
                <LinearGradient
                  colors={item.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, { minHeight: cardMinHeight, padding: cardPadding }]}
                >
                  <View style={styles.cardGlowTop} />
                  <View style={styles.cardGlowBottom} />

                  <View style={styles.cardTopRow}>
                    <View style={styles.cardIconWrap}>
                      <ServiceIcon size={24} color="#ffffff" />
                    </View>
                    <View style={styles.cardBadge}>
                      <ArrowRight size={14} color="#ffffff" />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>

                    <View style={styles.statsRow}>
                      {item.stats.map((stat) => (
                        <View key={stat} style={styles.statChip}>
                          <Text style={styles.statChipText}>{stat}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.bulletList}>
                      {item.bullets.map((bullet) => (
                        <View key={bullet} style={styles.bulletRow}>
                          <ShieldCheck size={16} color="#ffffff" />
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          snapToInterval={width}
          decelerationRate="fast"
          ref={slidesRef}
        />
      </View>

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

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
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: '#fb7185',
                },
              ]}
            />
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: '#e11d48',
            borderColor: 'rgba(225, 29, 72, 0.4)',
            marginBottom: insets.bottom || Metrics.lg,
          },
        ]}
        onPress={scrollTo}
        activeOpacity={0.85}
      >
        <Text style={[styles.buttonText, { color: '#ffffff' }]}>
          {currentIndex === slides.length - 1 ? 'Initialize' : 'Next'}
        </Text>
        <ChevronRight size={24} color={'#ffffff'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  orbLarge: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  orbSmall: {
    position: 'absolute',
    top: 120,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  header: {
    paddingHorizontal: Metrics.xl,
    paddingTop: Metrics.lg,
    paddingBottom: Metrics.sm,
  },
  logoImage: {
    width: 140,
    height: 48,
    resizeMode: 'contain',
    marginBottom: Metrics.lg,
  },
  kicker: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Metrics.xs,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: Typography.letterSpacing.tighter,
    marginBottom: Metrics.sm,
  },
  heroSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    lineHeight: 22,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Metrics.sm,
  },
  heroPill: {
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.xs,
    borderRadius: Metrics.borderRadius.full,
    borderWidth: 1,
    marginRight: Metrics.sm,
    marginBottom: Metrics.sm,
  },
  heroPillText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.xs,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  slidesContainer: {
    flex: 1,
    paddingBottom: Metrics.xs,
  },
  slide: {
    paddingHorizontal: Metrics.xl,
  },
  card: {
    minHeight: 340,
    borderRadius: Metrics.borderRadius.xl,
    padding: Metrics.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
    overflow: 'hidden',
  },
  cardGlowTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  cardGlowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Metrics.md,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Metrics.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardBadge: {
    width: 30,
    height: 30,
    borderRadius: Metrics.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  eyebrow: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.sm,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.84)',
    marginBottom: Metrics.sm,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: 24,
    lineHeight: 30,
    color: '#fff',
    marginBottom: Metrics.sm,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  cardDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: Metrics.md,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Metrics.md,
  },
  statChip: {
    borderRadius: Metrics.borderRadius.full,
    paddingHorizontal: Metrics.md,
    paddingVertical: Metrics.xs,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginRight: Metrics.sm,
    marginBottom: Metrics.sm,
  },
  statChipText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.xs,
    color: '#fff',
  },
  bulletList: {
    marginTop: Metrics.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Metrics.xs,
  },
  bulletText: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs,
    lineHeight: 18,
    color: '#fff',
    marginLeft: Metrics.sm,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Metrics.md,
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
    marginBottom: Metrics.lg,
    borderWidth: 1,
    borderColor: 'rgba(126, 226, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
    marginRight: Metrics.xs,
  },
});
