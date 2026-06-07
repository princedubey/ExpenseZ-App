import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BarChart4, Wallet, PieChart, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoogleAccessToken, findBackupFile, uploadBackupFile } from '@/services/googleDriveService';
import { transactionsToCSV } from '@/utils/csvHelper';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const Colors = useColors();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const getCurrentUser = useStore((s) => s.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    const ensureAuth = async () => {
      if (!isAuthenticated) {
        try {
          await getCurrentUser();
        } catch (e) {
          router.replace('/+auth/sign-in');
        }
      }
    };

    ensureAuth();
  }, [isAuthenticated]);

  // Daily Google Drive Auto-Sync Effect
  useEffect(() => {
    const runAutoSyncIfNeeded = async () => {
      const user = useStore.getState().user;
      const isGuest = !user || user.email === 'guest@offline.local';
      
      if (isAuthenticated && !isGuest) {
        try {
          const enabled = await AsyncStorage.getItem('@expensez_auto_sync_enabled');
          if (enabled === 'true') {
            const lastSync = await AsyncStorage.getItem('@expensez_last_sync_timestamp');
            const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0;
            const timeDiff = Date.now() - lastSyncTime;
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            if (timeDiff >= oneDayMs) {
              console.log('[Auto-Sync] Initiating daily auto-sync backup...');
              const token = await getGoogleAccessToken();
              if (token) {
                const transactions = useStore.getState().transactions;
                if (transactions && transactions.length > 0) {
                  const csvString = transactionsToCSV(transactions);
                  const existingFileId = await findBackupFile(token);
                  await uploadBackupFile(token, csvString, existingFileId);
                  
                  const newTimestamp = new Date().toISOString();
                  await AsyncStorage.setItem('@expensez_last_sync_timestamp', newTimestamp);
                  console.log('[Auto-Sync] Daily backup completed successfully!');
                }
              }
            }
          }
        } catch (error) {
          console.error('[Auto-Sync] Background auto-sync failed:', error);
        }
      }
    };

    if (isAuthenticated) {
      runAutoSyncIfNeeded();
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.gray[500],
        tabBarLabelStyle: {
          fontSize: Metrics.fontSizes.xs,
          fontWeight: '500',
        },
        tabBarStyle: {
          borderTopColor: Colors.gray[200],
          backgroundColor: Colors.light.background,
          height: Metrics.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: Metrics.xs,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}