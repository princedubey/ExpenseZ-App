import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Bell,
  HelpCircle,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import { useStore } from '@/store';

type ThemeMode = 'light' | 'dark' | 'system';

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const Colors = useColors();
  const [notifications, setNotifications] = useState(true);
  const logout = useStore((state) => state.logout);
  const user = useStore((state) => state.user);
  
  const toggleNotifications = () => {
    setNotifications(!notifications);
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/+auth/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const themeOptions = [
    {
      id: 'light' as ThemeMode,
      label: 'Light',
      icon: Sun,
    },
    {
      id: 'dark' as ThemeMode,
      label: 'Dark',
      icon: Moon,
    },
    {
      id: 'system' as ThemeMode,
      label: 'System',
      icon: Monitor,
    },
  ];
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.light.background,
    },
    header: {
      padding: Metrics.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.border,
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Metrics.fontSizes.xl,
      color: Colors.light.text,
    },
    content: {
      flex: 1,
    },
    profileCard: {
      margin: Metrics.md,
      backgroundColor: Colors.light.card,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Metrics.md,
    },
    profileInfo: {
      flex: 1,
      marginLeft: Metrics.md,
      marginRight: Metrics.sm,
    },
    profileName: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Metrics.fontSizes.lg,
      color: Colors.light.text,
      marginBottom: Metrics.xs / 2,
    },
    profileEmail: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.sm,
      color: Colors.gray[500],
    },
    editProfileButton: {
      paddingHorizontal: Metrics.md,
      paddingVertical: Metrics.sm,
      backgroundColor: Colors.primary[50],
      borderRadius: Metrics.borderRadius.full,
      marginLeft: 'auto',
    },
    editProfileText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Metrics.fontSizes.sm,
      color: Colors.primary[600],
    },
    section: {
      padding: Metrics.md,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Metrics.fontSizes.lg,
      marginBottom: Metrics.md,
      color: Colors.light.text,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Metrics.md,
      paddingHorizontal: Metrics.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.border,
    },
    settingIconContainer: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.gray[100],
      borderRadius: Metrics.borderRadius.md,
      marginRight: Metrics.md,
    },
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Metrics.fontSizes.md,
      color: Colors.light.text,
    },
    settingValue: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.sm,
      color: Colors.gray[500],
      marginTop: Metrics.xs / 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: Metrics.md,
      marginTop: Metrics.md,
      marginBottom: Metrics.sm,
      padding: Metrics.md,
      backgroundColor: Colors.error[50],
      borderRadius: Metrics.borderRadius.md,
    },
    logoutText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Metrics.fontSizes.md,
      color: Colors.error[600],
      marginLeft: Metrics.sm,
    },
    versionText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.xs,
      color: Colors.gray[500],
      textAlign: 'center',
      marginBottom: Metrics.xl,
    },
    themeOptions: {
      borderRadius: Metrics.borderRadius.lg,
      padding: Metrics.sm,
      backgroundColor: Colors.light.card,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Metrics.md,
      borderRadius: Metrics.borderRadius.md,
      marginBottom: Metrics.xs,
    },
    themeOptionText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Metrics.fontSizes.md,
      marginLeft: Metrics.md,
      color: Colors.light.text,
    },
  });
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profileContainer}>
            <Avatar
              uri={user?.avatar}
              initials={user?.name?.charAt(0) || 'U'}
              size="lg"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text 
                style={styles.profileEmail}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.email || 'user@example.com'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/(modals)/profile/edit' as any)}
            >
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Theme Selection */}
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.themeOption,
                  theme === option.id && {
                    backgroundColor: Colors.primary[50],
                  },
                ]}
                onPress={() => setTheme(option.id)}
              >
                <option.icon
                  size={Metrics.iconSize.md}
                  color={theme === option.id ? Colors.primary[600] : Colors.gray[500]}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    theme === option.id && { color: Colors.primary[600] },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={Metrics.iconSize.md} color={Colors.gray[600]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingValue}>Manage your notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: Colors.gray[300], true: Colors.primary[300] }}
              thumbColor={notifications ? Colors.primary[600] : Colors.gray[400]}
            />
          </View>
        </View>
        
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(modals)/security/change-password' as any)}
          >
            <View style={styles.settingIconContainer}>
              <Shield size={Metrics.iconSize.md} color={Colors.gray[600]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingValue}>Update your password</Text>
            </View>
            <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
          </TouchableOpacity>
        </View>
        
        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(modals)/help/faq' as any)}
          >
            <View style={styles.settingIconContainer}>
              <HelpCircle size={Metrics.iconSize.md} color={Colors.gray[600]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>FAQ</Text>
              <Text style={styles.settingValue}>Frequently asked questions</Text>
            </View>
            <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(modals)/help/terms' as any)}
          >
            <View style={styles.settingIconContainer}>
              <Shield size={Metrics.iconSize.md} color={Colors.gray[600]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Terms & Conditions</Text>
              <Text style={styles.settingValue}>Read our terms of service</Text>
            </View>
            <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
          </TouchableOpacity>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={Metrics.iconSize.md} color={Colors.error[600]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}