import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';

const faqs = [
  {
    question: 'How do I add a new transaction?',
    answer: 'To add a new transaction, tap the "+" button on the home screen or transactions tab. Fill in the transaction details including amount, category, and date, then tap "Save".'
  },
  {
    question: 'How can I edit or delete a transaction?',
    answer: 'To edit or delete a transaction, go to the Transactions tab, find the transaction you want to modify, and tap on it. You can then choose to edit or delete the transaction.'
  },
  {
    question: 'How do I view my spending analytics?',
    answer: 'Go to the Analytics tab to view detailed insights about your spending patterns, including monthly trends, category-wise breakdown, and overall financial summary.'
  },
  {
    question: 'Can I change my password?',
    answer: 'Yes, you can change your password by going to Settings > Security > Change Password. Follow the prompts to set a new password.'
  },
  {
    question: 'How do I enable notifications?',
    answer: 'Go to Settings > Preferences > Notifications to toggle notification settings. You can enable or disable various types of notifications.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take data security seriously. All your financial data is encrypted and stored securely. We use industry-standard security measures to protect your information.'
  },
  {
    question: 'How do I export my transaction data?',
    answer: 'Currently, you can view your transaction history in the app. We are working on adding export functionality in a future update.'
  },
  {
    question: 'What currencies are supported?',
    answer: 'Currently, the app supports Indian Rupees (INR). We plan to add support for more currencies in future updates.'
  }
];

export default function FAQScreen() {
  const router = useRouter();
  const Colors = useColors();
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
    faqItem: {
      marginBottom: Metrics.md,
      borderRadius: Metrics.borderRadius.md,
      padding: Metrics.md,
    },
    questionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    question: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Metrics.fontSizes.md,
      flex: 1,
      marginRight: Metrics.sm,
    },
    answer: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.sm,
      marginTop: Metrics.sm,
      lineHeight: Metrics.fontSizes.md * 1.5,
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
        <Text style={[styles.title, { color: Colors.light.text }]}>FAQ</Text>
      </View>

      <ScrollView style={styles.content}>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faqItem, { backgroundColor: Colors.light.card }]}
            onPress={() => toggleFAQ(index)}
          >
            <View style={styles.questionContainer}>
              <Text style={[styles.question, { color: Colors.light.text }]}>
                {faq.question}
              </Text>
              {expandedIndex === index ? (
                <ChevronUp size={Metrics.iconSize.md} color={Colors.gray[500]} />
              ) : (
                <ChevronDown size={Metrics.iconSize.md} color={Colors.gray[500]} />
              )}
            </View>
            {expandedIndex === index && (
              <Text style={[styles.answer, { color: Colors.gray[600] }]}>
                {faq.answer}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
} 