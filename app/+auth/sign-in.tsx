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
import { Mail, Lock, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import debounce from 'lodash/debounce';
import Checkbox from '@/components/ui/Checkbox';
import {
  configureGoogleSignIn,
  isGoogleSignInAvailable,
  signInWithGoogle,
} from '@/config/google-signin';
import GoogleIcon from '@/components/ui/GoogleIcon';

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const login = useStore((state) => state.login);
  const loadStoredCredentials = useStore((state) => state.loadStoredCredentials);
  const { showToast } = useToast();
  const googleSignInAvailable = isGoogleSignInAvailable();

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const credentials = await loadStoredCredentials();
        if (credentials) {
          setEmail(credentials.email);
          setPassword(credentials.password);
          handleSignIn(credentials.email, credentials.password);
        }
      } catch (error) {
        console.error('Error loading stored credentials:', error);
      }
    };

    loadCredentials();
    try {
      configureGoogleSignIn();
    } catch (e: unknown) {
      console.warn('Google Sign-In config error:', String(e));
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleSignIn = useCallback(
    async (emailToUse = email, passwordToUse = password) => {
      if (isCooldown) {
        showToast('Please wait before trying again', 'error');
        return;
      }

      if (validateForm()) {
        try {
          setIsLoading(true);
          await login(emailToUse, passwordToUse, rememberMe);
          showToast('Welcome back! You have successfully signed in.', 'success');
          setEmail('');
          setPassword('');
          router.replace('/(tabs)');
        } catch (error: any) {
          if (error?.response?.status === 404) {
            showToast('Invalid email or password', 'error');
          } else if (error?.response?.status === 429) {
            showToast('Too many attempts. Please wait a moment.', 'error');
            setIsCooldown(true);
            setTimeout(() => setIsCooldown(false), 30000);
          } else {
            showToast('An error occurred. Please try again.', 'error');
          }
          console.error('Login error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [email, password, isCooldown, login, router, showToast, rememberMe, validateForm]
  );

  const debouncedSignIn = useCallback(
    debounce(() => handleSignIn(), 800, { leading: true, trailing: false }),
    [handleSignIn]
  );

  const navigateToSignUp = () => router.push('/+auth/sign-up');
  const navigateToForgotPassword = () => router.push('/+auth/forgot-password');

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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your dashboard</Text>
          </View>

          {/* Floating Form Card */}
          <View style={[styles.card, { backgroundColor: colors.light.card }]}> 
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="hello@you.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                leftIcon={<Mail size={Metrics.iconSize.sm} color={colors.gray[500]} />}
                containerStyle={{ backgroundColor: colors.light.input, borderColor: colors.light.inputBorder }}
                editable={!isCooldown}
              />

              <Input
                label="Password"
                placeholder="Your secure password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon={<Lock size={Metrics.iconSize.sm} color={colors.gray[500]} />}
                containerStyle={{ backgroundColor: colors.light.input, borderColor: colors.light.inputBorder }}
                isPassword
                editable={!isCooldown}
              />

              <View style={styles.rememberRow}>
                <Checkbox value={rememberMe} onValueChange={setRememberMe} label="Remember me" disabled={isCooldown} />
                <TouchableOpacity onPress={navigateToForgotPassword} disabled={isCooldown}>
                  <Text style={[styles.forgotPasswordText, { color: colors.primary[600] }]}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={isCooldown ? 'Please wait...' : 'Sign In'}
                onPress={debouncedSignIn}
                loading={isLoading}
                fullWidth
                variant="primary"
                size="lg"
                style={{ borderRadius: Metrics.borderRadius.lg, marginTop: Metrics.md, shadowColor: colors.primary[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                textStyle={{ fontSize: Metrics.fontSizes.md + 1 }}
                disabled={isCooldown}
              />

              {googleSignInAvailable && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={[styles.divider, { backgroundColor: colors.light.border }]} />
                    <Text style={[styles.dividerText, { color: colors.gray[500] }]}>OR</Text>
                    <View style={[styles.divider, { backgroundColor: colors.light.border }]} />
                  </View>
                  <Button
                    title="Continue with Google"
                    onPress={async () => {
                      try {
                        setIsLoading(true);
                        const userInfo: any = await signInWithGoogle();
                        const idToken: string | undefined = userInfo?.idToken;
                        if (idToken) {
                          const loginWithGoogle = useStore.getState().loginWithGoogle;
                          await loginWithGoogle(idToken);
                          showToast('Signed in with Google', 'success');
                          router.replace('/(tabs)');
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
                    variant="outline"
                    size="lg"
                    style={{ borderRadius: Metrics.borderRadius.lg, backgroundColor: 'transparent' }}
                    textStyle={{ color: colors.light.text }}
                  />
                </>
              )}

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: colors.gray[600] }]}>Don{"'"}t have an account?</Text>
                <TouchableOpacity onPress={navigateToSignUp} disabled={isCooldown}>
                  <Text style={[styles.signUpText, { color: colors.primary[600] }]}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  form: { width: '100%' },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Metrics.xs, marginBottom: Metrics.lg },
  forgotPasswordText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Metrics.fontSizes.sm },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Metrics.lg,
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
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Metrics.xl },
  footerText: { fontFamily: Typography.fontFamily.regular, fontSize: Metrics.fontSizes.md, marginRight: Metrics.xs },
  signUpText: { fontFamily: Typography.fontFamily.bold, fontSize: Metrics.fontSizes.md },
});
