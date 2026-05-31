import React, { useState } from 'react';
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
import { Mail, ArrowLeft, Key } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        setIsSubmitted(true);
      }, 1500);
    }
  };
  
  const navigateToSignIn = () => {
    router.push('/+auth/sign-in');
  };
  
  const goBack = () => {
    router.back();
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
          
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ArrowLeft size={Metrics.iconSize.md} color={'#ffffff'} />
          </TouchableOpacity>

          {/* Brand Hero Section */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Image 
                source={require('../../assets/images/expensez-logo.png')} 
                style={{ width: 44, height: 44, resizeMode: 'contain' }} 
              />
            </View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>{"Enter your email to receive a reset link"}</Text>
          </View>

          {/* Floating Form Card */}
          <View style={[styles.card, { backgroundColor: colors.light.card }]}> 
            {isSubmitted ? (
              <View style={styles.successContainer}>
                <Text style={[styles.successTitle, { color: colors.light.text }]}>Check Your Email</Text>
                <Text style={[styles.successMessage, { color: colors.gray[600] }]}>
                  {"We've sent a password reset link to "}
                  {email}
                  {'. Please check your inbox and follow the instructions.'}
                </Text>
                <Button
                  title="Back to Sign In"
                  onPress={navigateToSignIn}
                  variant="primary"
                  style={{ borderRadius: Metrics.borderRadius.lg, marginTop: Metrics.md, shadowColor: colors.primary[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                  textStyle={{ fontSize: Metrics.fontSizes.md + 1 }}
                />
              </View>
            ) : (
              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  error={error}
                  leftIcon={<Mail size={Metrics.iconSize.sm} color={colors.gray[500]} />}
                  containerStyle={{ backgroundColor: colors.light.input, borderColor: colors.light.inputBorder }}
                />
                
                <Button
                  title="Send Reset Link"
                  onPress={handleSubmit}
                  loading={isLoading}
                  fullWidth
                  variant="primary"
                  size="lg"
                  style={{ borderRadius: Metrics.borderRadius.lg, marginTop: Metrics.md, shadowColor: colors.primary[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                  textStyle={{ fontSize: Metrics.fontSizes.md + 1 }}
                />

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.gray[600] }]}>Remember your password?</Text>
                  <TouchableOpacity onPress={navigateToSignIn}>
                    <Text style={[styles.signInText, { color: colors.primary[600] }]}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: Metrics.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30,
    marginTop: 20,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: Metrics.lg,
  },
  successTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
    marginBottom: Metrics.sm,
  },
  successMessage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    textAlign: 'center',
    marginBottom: Metrics.xl,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Metrics.xl },
  footerText: { fontFamily: Typography.fontFamily.regular, fontSize: Metrics.fontSizes.md, marginRight: Metrics.xs },
  signInText: { fontFamily: Typography.fontFamily.bold, fontSize: Metrics.fontSizes.md },
});