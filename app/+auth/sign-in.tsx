import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import debounce from 'lodash/debounce';
import Checkbox from '../../components/ui/Checkbox';

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const login = useStore((state) => state.login);
  const loadStoredCredentials = useStore((state) => state.loadStoredCredentials);
  const { showToast } = useToast();

  // Load stored credentials on mount
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const credentials = await loadStoredCredentials();
        if (credentials) {
          setEmail(credentials.email);
          setPassword(credentials.password);
          // Auto login with stored credentials
          handleSignIn(credentials.email, credentials.password);
        }
      } catch (error) {
        console.error('Error loading stored credentials:', error);
      }
    };

    loadCredentials();
  }, []);
  
  const validateForm = () => {
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
  };
  
  const handleLoginError = (error: any) => {
    if (error?.response?.status === 429) {
      showToast('Too many attempts. Please wait a moment.', 'error');
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 30000); // 30 second cooldown
    } else {
      showToast('Invalid email or password', 'error');
    }
  };
  
  const handleSignIn = useCallback(async (emailToUse = email, passwordToUse = password) => {
    if (isCooldown) {
      showToast('Please wait before trying again', 'error');
      return;
    }

    if (validateForm()) {
      try {
      setIsLoading(true);
        await login(emailToUse, passwordToUse, rememberMe);
        showToast('Welcome back! You have successfully signed in.', 'success');
        // Clear form
        setEmail('');
        setPassword('');
        // Navigate to main app
        router.replace('/(tabs)');
      } catch (error: any) {
        if (error?.response?.status === 404) {
          showToast('Invalid email or password', 'error');
        } else {
          showToast('An error occurred. Please try again.', 'error');
        }
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [email, password, isCooldown, login, router, showToast, rememberMe]);

  // Debounce the sign in function to prevent rapid requests
  const debouncedSignIn = useCallback(
    debounce((e?: any) => {
      if (e) e.persist();
      handleSignIn();
    }, 1000, { leading: true, trailing: false }),
    [handleSignIn]
  );
  
  const navigateToSignUp = () => {
    router.push('/+auth/sign-up');
  };
  
  const navigateToForgotPassword = () => {
    router.push('/+auth/forgot-password');
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.light.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.light.text }]}>Welcome Back!</Text>
          <Text style={[styles.subtitle, { color: colors.gray[600] }]}>Sign in to continue to your account</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            leftIcon={<Mail size={Metrics.iconSize.sm} color={colors.gray[500]} />}
            editable={!isCooldown}
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={<Lock size={Metrics.iconSize.sm} color={colors.gray[500]} />}
            isPassword
            editable={!isCooldown}
          />
          
          <View style={styles.rememberMeContainer}>
            <Checkbox
              value={rememberMe}
              onValueChange={setRememberMe}
              label="Remember me"
              disabled={isCooldown}
            />
          <TouchableOpacity
            onPress={navigateToForgotPassword}
              disabled={isCooldown}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary[600] }]}>Forgot Password?</Text>
          </TouchableOpacity>
          </View>
          
          <Button
            title={isCooldown ? "Please wait..." : "Sign In"}
            onPress={debouncedSignIn}
            loading={isLoading}
            fullWidth
            style={styles.signInButton}
            disabled={isCooldown}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.gray[600] }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={navigateToSignUp} disabled={isCooldown}>
            <Text style={[styles.signUpText, { color: colors.primary[600] }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Metrics.xl,
    paddingVertical: Metrics.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Metrics.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.title,
    marginBottom: Metrics.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: Metrics.xl,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Metrics.sm,
    marginBottom: Metrics.xl,
  },
  forgotPasswordText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Metrics.fontSizes.sm,
  },
  signInButton: {
    marginTop: Metrics.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    marginRight: Metrics.xs,
  },
  signUpText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
});