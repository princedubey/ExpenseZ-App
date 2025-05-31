import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';

const terms = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.'
  },
  {
    title: '2. User Account',
    content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.'
  },
  {
    title: '3. Privacy Policy',
    content: 'Your use of the application is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the application and informs users of our data collection practices.'
  },
  {
    title: '4. Data Security',
    content: 'We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.'
  },
  {
    title: '5. User Responsibilities',
    content: 'You agree to use the application only for lawful purposes and in accordance with these Terms. You are responsible for all activities that occur under your account.'
  },
  {
    title: '6. Prohibited Activities',
    content: 'You may not use the application for any illegal or unauthorized purpose. You must not transmit any worms, viruses, or any code of a destructive nature.'
  },
  {
    title: '7. Intellectual Property',
    content: 'The application and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.'
  },
  {
    title: '8. Limitation of Liability',
    content: 'In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the application.'
  },
  {
    title: '9. Changes to Terms',
    content: 'We reserve the right to modify or replace these Terms at any time. It is your responsibility to review these Terms periodically for changes.'
  },
  {
    title: '10. Termination',
    content: 'We may terminate or suspend your account and bar access to the application immediately, without prior notice or liability, under our sole discretion.'
  }
];

export default function TermsScreen() {
  const router = useRouter();
  const Colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Metrics.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.border,
    },
    backButton: {
      marginRight: Metrics.md,
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Metrics.fontSizes.xl,
    },
    content: {
      flex: 1,
      padding: Metrics.md,
    },
    section: {
      marginBottom: Metrics.xl,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Metrics.fontSizes.lg,
      marginBottom: Metrics.sm,
    },
    sectionContent: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.md,
      lineHeight: Metrics.fontSizes.md * 1.5,
    },
    footer: {
      padding: Metrics.md,
      borderTopWidth: 1,
      borderTopColor: Colors.light.border,
    },
    footerText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.sm,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={Metrics.iconSize.lg} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.light.text }]}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.content}>
        {terms.map((term, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
              {term.title}
            </Text>
            <Text style={[styles.sectionContent, { color: Colors.gray[600] }]}>
              {term.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors.gray[500] }]}>
          By using this application, you agree to these terms and conditions.
        </Text>
      </View>
    </SafeAreaView>
  );
} 