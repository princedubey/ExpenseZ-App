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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Typography from '@/constants/Typography';
import Metrics from '@/constants/Metrics';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/store';

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useColors();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const register = useStore((state) => state.register);
  
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
        Alert.alert(
          'Success',
          'Account created successfully! Please sign in.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setName('');
                setEmail('');
                setPassword('');
                // Navigate to sign in
                router.replace('/+auth/sign-in');
              }
            }
          ]
        );
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
          <Text style={[styles.title, { color: colors.light.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.gray[600] }]}>Sign up to get started</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<User size={Metrics.iconSize.sm} color={colors.gray[500]} />}
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
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={<Lock size={Metrics.iconSize.sm} color={colors.gray[500]} />}
            isPassword
          />
          
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={isLoading}
            fullWidth
            style={styles.signUpButton}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.gray[600] }]}>Already have an account?</Text>
          <TouchableOpacity onPress={navigateToSignIn}>
            <Text style={[styles.signInText, { color: colors.primary[600] }]}>Sign In</Text>
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
  signUpButton: {
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
  signInText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Metrics.fontSizes.md,
  },
});