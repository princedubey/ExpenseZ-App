import { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/store';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const loadStoredCredentials = useStore((state) => state.loadStoredCredentials);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const checkNavigation = async () => {
      try {
        // Load stored credentials/session if they exist
        await loadStoredCredentials();
        
        const onboardingCompleted = await AsyncStorage.getItem('@onboarding_completed');
        
        // Wait at least 2 seconds for splash screen animation
        setTimeout(() => {
          const isAuthed = useStore.getState().isAuthenticated;
          if (isAuthed) {
            router.replace('/(tabs)');
          } else if (onboardingCompleted === 'true') {
            router.replace('/+auth/sign-in');
          } else {
            router.replace('/intro');
          }
        }, 2000);
      } catch (error) {
        console.error('Splash screen routing error:', error);
        setTimeout(() => {
          router.replace('/intro');
        }, 2000);
      }
    };

    checkNavigation();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/icon.png')}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B02144',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
});