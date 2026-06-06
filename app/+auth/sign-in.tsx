import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Button from '@/components/ui/Button';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  configureGoogleSignIn,
  isGoogleSignInAvailable,
  signInWithGoogle,
  webClientId,
} from '@/config/google-signin';
import GoogleIcon from '@/components/ui/GoogleIcon';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const loginWithGoogle = useStore((state) => state.loginWithGoogle);
  const loginAsGuest = useStore((state) => state.loginAsGuest);
  const { showToast } = useToast();
  const googleSignInAvailable = isGoogleSignInAvailable();

  const handleGoogleLogin = useCallback(async (idToken: string, userInfo?: any) => {
    try {
      setIsLoading(true);
      await loginWithGoogle(idToken, userInfo);
      showToast('Signed in with Google', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Google sign-in failed:', error);
      showToast('Google sign-in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, router, showToast]);

  const handleGuestLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      await loginAsGuest('Guest User');
      showToast('Welcome! Operating in Offline Guest Mode.', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Guest login failed:', error);
      showToast('Failed to enter guest mode', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [loginAsGuest, router, showToast]);

  useEffect(() => {
    try {
      configureGoogleSignIn();
    } catch (e: unknown) {
      console.warn('Google Sign-In config error:', String(e));
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.light.background }]}>
      <LinearGradient
        colors={isDark ? [colors.primary[300], colors.primary[100]] : [colors.primary[600], colors.primary[800]]}
        style={styles.heroBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Brand Hero Section */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Image 
                source={require('../../assets/images/expensez-logo.png')} 
                style={{ width: 44, height: 44, resizeMode: 'contain' }} 
              />
            </View>
            <Text style={styles.title}>ExpenseZ</Text>
            <Text style={styles.subtitle}>Personal. Private. Decentralized.</Text>
          </View>

          {/* Core Sign In Actions */}
          <View style={[styles.card, { backgroundColor: colors.light.card }]}> 
            <View style={styles.form}>
              <Text style={[styles.privacyHeadline, { color: colors.light.text }]}>
                Your Financial Privacy First
              </Text>
              <Text style={[styles.privacyDescription, { color: colors.gray[500] }]}>
                We do not store your data on our servers. All transactions and budgets live safely on your device.
              </Text>

              <View style={styles.buttonSpacing} />

              {/* Google Sign In for Sync */}
              {googleSignInAvailable ? (
                <Button
                  title="Continue with Google"
                  onPress={async () => {
                    try {
                      setIsLoading(true);
                      const userInfo: any = await signInWithGoogle();
                      const idToken: string | undefined = userInfo?.idToken;
                      if (idToken) {
                        await handleGoogleLogin(idToken, userInfo);
                      }
                    } catch (error) {
                      console.error('Google sign-in failed:', error);
                      showToast('Google sign-in failed', 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  fullWidth
                  icon={<GoogleIcon size={18} />}
                  iconPosition="left"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  style={{ borderRadius: Metrics.borderRadius.lg }}
                />
              ) : (
                <WebGoogleSignInButton onLogin={handleGoogleLogin} colors={colors} isLoading={isLoading} />
              )}

              <View style={styles.dividerRow}>
                <View style={[styles.divider, { backgroundColor: colors.light.border }]} />
                <Text style={[styles.dividerText, { color: colors.gray[500] }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.light.border }]} />
              </View>

              {/* Offline Guest Login */}
              <Button
                title="Continue as Guest (Offline)"
                onPress={handleGuestLogin}
                fullWidth
                icon={<User size={18} color={colors.light.text} />}
                iconPosition="left"
                variant="outline"
                size="lg"
                disabled={isLoading}
                style={{ borderRadius: Metrics.borderRadius.lg, backgroundColor: 'transparent' }}
                textStyle={{ color: colors.light.text }}
              />

              <View style={[styles.privacyCard, { backgroundColor: colors.gray[50], borderColor: colors.light.border }]}>
                <ShieldCheck size={20} color={colors.primary[600]} style={{ marginRight: Metrics.sm }} />
                <Text style={[styles.privacyNote, { color: colors.gray[600] }]}>
                  Google account is only used to sync a secure CSV backup file on your Google Drive.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface WebGoogleSignInButtonProps {
  onLogin: (idToken: string) => Promise<void>;
  colors: any;
  isLoading: boolean;
}

function WebGoogleSignInButton({ onLogin, colors, isLoading }: WebGoogleSignInButtonProps) {
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId,
    responseType: 'id_token',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication, params } = googleResponse;
      const idToken = params?.id_token || authentication?.idToken;
      if (idToken) {
        onLogin(idToken);
      }
    }
  }, [googleResponse, onLogin]);

  return (
    <Button
      title="Continue with Google"
      onPress={() => promptGoogleAsync()}
      fullWidth
      icon={<GoogleIcon size={18} />}
      iconPosition="left"
      variant="primary"
      size="lg"
      loading={isLoading}
      style={{ borderRadius: Metrics.borderRadius.lg }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Metrics.xl,
    paddingTop: 80,
    paddingBottom: Metrics.xxl,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Metrics.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { 
    fontFamily: Typography.fontFamily.bold, 
    fontSize: Metrics.fontSizes.title + 2, 
    color: '#ffffff',
    marginBottom: Metrics.xs 
  },
  subtitle: { 
    fontFamily: Typography.fontFamily.medium, 
    fontSize: Metrics.fontSizes.md, 
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center' 
  },
  card: { 
    width: '100%', 
    borderRadius: Metrics.borderRadius.xl, 
    padding: Metrics.xl, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 10, 
  },
  form: { width: '100%', alignItems: 'center' },
  privacyHeadline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.lg,
    textAlign: 'center',
    marginBottom: Metrics.sm,
  },
  privacyDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Metrics.md,
  },
  buttonSpacing: {
    height: Metrics.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Metrics.lg,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Metrics.md,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Metrics.borderRadius.md,
    borderWidth: 1,
    padding: Metrics.md,
    marginTop: Metrics.xl,
    width: '100%',
  },
  privacyNote: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.xs - 1,
    flex: 1,
    lineHeight: 16,
  },
});
