import React, { useState } from 'react';
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
import { Mail, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={Metrics.iconSize.md} color={Colors.gray[800]} />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>
        
        {isSubmitted ? (
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
            </Text>
            <Button
              title="Back to Sign In"
              onPress={navigateToSignIn}
              variant="primary"
              style={styles.backToSignInButton}
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
              leftIcon={<Mail size={Metrics.iconSize.sm} color={Colors.gray[500]} />}
            />
            
            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              style={styles.submitButton}
            />
          </View>
        )}
        
        {!isSubmitted && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity onPress={navigateToSignIn}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Metrics.xl,
    paddingVertical: Metrics.xxl,
  },
  backButton: {
    position: 'absolute',
    top: Metrics.xl,
    left: Metrics.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: Metrics.xl * 2,
    marginBottom: Metrics.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.title,
    color: Colors.gray[900],
    marginBottom: Metrics.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: Metrics.xl,
  },
  submitButton: {
    marginTop: Metrics.xl,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: Metrics.xl,
  },
  successTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Metrics.fontSizes.xl,
    color: Colors.gray[900],
    marginBottom: Metrics.sm,
  },
  successMessage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Metrics.xl,
  },
  backToSignInButton: {
    minWidth: 200,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Metrics.xl,
  },
  footerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Metrics.fontSizes.md,
    color: Colors.gray[600],
    marginRight: Metrics.xs,
  },
  signInText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
    color: Colors.primary[600],
  },
});