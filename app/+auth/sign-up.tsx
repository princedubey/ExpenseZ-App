import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const register = useStore((state) => state.register);
  const { showToast } = useToast();
  
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignUp = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        await register(email, password, name);
        // On successful register the store already saves tokens and user.
        showToast('Account created — welcome!', 'success');
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        // Navigate directly to app dashboard
        router.replace('/(tabs)');
      } catch (error) {
        Alert.alert('Error', 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const navigateToSignIn = () => {
    router.push('/+auth/sign-in');
  };
  
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey with a secure account</Text>
          </View>

          {/* Floating Form Card */}
          <View style={[styles.card, { backgroundColor: colors.light.card }]}> 
            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                error={errors.name}
                leftIcon={<User size={Metrics.iconSize.sm} color={colors.gray[500]} />}
                containerStyle={{ backgroundColor: colors.light.input, borderColor: colors.light.inputBorder }}
              />
              
              <Input
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                leftIcon={<Mail size={Metrics.iconSize.sm} color={colors.gray[500]} />}
                containerStyle={{ backgroundColor: colors.light.input, borderColor: colors.light.inputBorder }}
              />
              
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon={<Lock size={Metrics.iconSize.sm} color={colors.gray[500]} />}
                containerStyle={{ backgroundColor: colors.light.input, borderColor: colors.light.inputBorder }}
                isPassword
              />
              
              <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={isLoading}
                fullWidth
                variant="primary"
                size="lg"
                style={{ borderRadius: Metrics.borderRadius.lg, marginTop: Metrics.md, shadowColor: colors.primary[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                textStyle={{ fontSize: Metrics.fontSizes.md + 1 }}
              />

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.gray[600] }]}>Already have an account?</Text>
                <TouchableOpacity onPress={navigateToSignIn}>
                  <Text style={[styles.signInText, { color: colors.primary[600] }]}>Sign In</Text>
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
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Metrics.xl },
  footerText: { fontFamily: Typography.fontFamily.regular, fontSize: Metrics.fontSizes.md, marginRight: Metrics.xs },
  signInText: { fontFamily: Typography.fontFamily.bold, fontSize: Metrics.fontSizes.md },
});