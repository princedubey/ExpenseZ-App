import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Modal, Pressable, TextInput, Platform } from 'react-native';
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
  Cloud,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Database,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useColors } from '@/constants/Colors';
import Metrics from '@/constants/Metrics';
import Typography from '@/constants/Typography';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import { useStore } from '@/store';
import { useToast } from '@/contexts/ToastContext';
import { getGoogleAccessToken, findBackupFile, downloadBackupFile, uploadBackupFile } from '@/services/googleDriveService';
import { transactionsToCSV, csvToTransactions } from '@/utils/csvHelper';
import { isGoogleSignInAvailable, signInWithGoogle } from '@/config/google-signin';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const Colors = useColors();
  const [notifications, setNotifications] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const logout = useStore((state) => state.logout);
  const deleteAccount = useStore((state) => state.deleteAccount);
  const user = useStore((state) => state.user);
  const { showToast } = useToast();
  
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const updateUser = useStore((state) => state.updateUser);

  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load auto-sync settings on mount
  useEffect(() => {
    const loadSyncSettings = async () => {
      try {
        const enabled = await AsyncStorage.getItem('@expensez_auto_sync_enabled');
        const timestamp = await AsyncStorage.getItem('@expensez_last_sync_timestamp');
        setAutoSync(enabled === 'true');
        setLastSyncTime(timestamp);
      } catch (e) {
        console.error('Error loading sync settings:', e);
      }
    };
    loadSyncSettings();
  }, []);

  const toggleAutoSync = async (value: boolean) => {
    try {
      setAutoSync(value);
      await AsyncStorage.setItem('@expensez_auto_sync_enabled', value ? 'true' : 'false');
      if (value) {
        showToast('Auto-Sync enabled!', 'success');
        // Trigger a backup immediately in background to verify credentials
        handleBackupToGoogleDrive(true);
      } else {
        showToast('Auto-Sync disabled', 'info');
      }
    } catch (e) {
      console.error('Error toggling auto-sync:', e);
      showToast('Failed to save settings', 'error');
    }
  };

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return '';
    }
  };

  const handleEditProfile = () => {
    setEditName(user?.name || '');
    setIsEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    try {
      await updateUser({ name: editName.trim() });
      showToast('Profile updated successfully!', 'success');
      setIsEditProfileVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile.');
    }
  };
  
  const isGuest = !user || user.email === 'guest@offline.local';

  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const ensureGoogleConnected = async (): Promise<boolean> => {
    if (!isGuest) return true;

    try {
      setSyncing(true);
      
      let idToken: string | null = null;
      let userInfo: any = null;

      if (isGoogleSignInAvailable()) {
        const response = await signInWithGoogle();
        if (response && response.type === 'success' && response.data) {
          userInfo = response.data;
          idToken = response.data.idToken;
        } else if (response && response.idToken) {
          userInfo = response;
          idToken = response.idToken;
        } else if (response?.type === 'cancelled') {
          showToast('Sync cancelled', 'info');
          return false;
        }
      } else {
        Alert.alert(
          'Google Cloud Sync',
          'Google Cloud Sync requires running on a mobile device. For web/testing environments, please sign in with Google from the main Sign-In screen.'
        );
        return false;
      }

      if (idToken) {
        const loginWithGoogle = useStore.getState().loginWithGoogle;
        await loginWithGoogle(idToken, userInfo);
        showToast('Google account connected successfully!', 'success');
        return true;
      } else {
        throw new Error('Google Sign-In failed to return credentials.');
      }
    } catch (error: any) {
      console.error('[Settings] Connect Google error:', error);
      Alert.alert('Connection Failed', error?.message || 'Could not link your Google account.');
      return false;
    } finally {
      setSyncing(false);
    }
  };
  
  const handleBackupToGoogleDrive = async (silent = false) => {
    const connected = await ensureGoogleConnected();
    if (!connected) return false;

    try {
      setSyncing(true);
      const token = await getGoogleAccessToken();
      if (!token) {
        throw new Error('Could not retrieve Google access token. Please sign in again.');
      }

      const transactions = useStore.getState().transactions;
      if (!transactions || transactions.length === 0) {
        if (!silent) {
          Alert.alert('Backup Info', 'No transaction data found locally to back up.');
        }
        setSyncing(false);
        return false;
      }

      const csvString = transactionsToCSV(transactions);
      const existingFileId = await findBackupFile(token);
      await uploadBackupFile(token, csvString, existingFileId);
      
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem('@expensez_last_sync_timestamp', timestamp);
      setLastSyncTime(timestamp);

      showToast('Data backed up to Google Drive successfully!', 'success');
      if (!silent) {
        Alert.alert('Backup Success', 'Your transactions have been synchronized to your Google Drive.');
      }
      return true;
    } catch (error: any) {
      console.error('[Settings] Backup error:', error);
      if (!silent) {
        Alert.alert('Backup Failed', error?.message || 'An error occurred during Google Drive backup.');
      }
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const handleRestoreFromGoogleDrive = async () => {
    const connected = await ensureGoogleConnected();
    if (!connected) return;

    Alert.alert(
      'Restore Data',
      'Warning: This action will replace all local transactions on this device with the file on Google Drive. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncing(true);
              const token = await getGoogleAccessToken();
              if (!token) {
                throw new Error('Could not retrieve Google access token.');
              }

              const fileId = await findBackupFile(token);
              if (!fileId) {
                Alert.alert('Restore Failed', 'No backup file found on your Google Drive.');
                setSyncing(false);
                return;
              }

              const csvContent = await downloadBackupFile(token, fileId);
              if (!csvContent) {
                Alert.alert('Restore Failed', 'The backup file on Google Drive is empty.');
                setSyncing(false);
                return;
              }

              const restoredTransactions = csvToTransactions(csvContent, useStore.getState().user?.id || 'google_user');
              
              await AsyncStorage.setItem('@expensez_transactions', JSON.stringify(restoredTransactions));
              useStore.getState().setTransactions(restoredTransactions);
              await useStore.getState().getUserStats();

              showToast('Data restored from Google Drive successfully!', 'success');
              Alert.alert('Restore Success', `Successfully loaded ${restoredTransactions.length} transactions from cloud.`);
            } catch (error: any) {
              console.error('[Settings] Restore error:', error);
              Alert.alert('Restore Failed', error?.message || 'An error occurred during restore.');
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  const handleExportLocalCSV = async () => {
    try {
      const transactions = useStore.getState().transactions;
      if (!transactions || transactions.length === 0) {
        Alert.alert('Export CSV', 'No transaction data available to export.');
        return;
      }

      const csvString = transactionsToCSV(transactions);

      if (Platform.OS === 'web') {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = globalThis.document?.createElement('a');
        if (!link) return;
        link.href = url;
        link.download = 'ExpenseZ_Export.csv';
        globalThis.document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('CSV Export downloaded successfully!', 'success');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + 'ExpenseZ_Export.csv';
      
      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export ExpenseZ Transactions',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'CSV sharing is not supported on this platform.');
      }
    } catch (error: any) {
      console.error('[Settings] Export error:', error);
      Alert.alert('Export Failed', error?.message || 'Could not export local CSV.');
    }
  };

  const handleExportLocalJSON = async () => {
    try {
      const transactions = useStore.getState().transactions;
      if (!transactions || transactions.length === 0) {
        Alert.alert('Export Backup', 'No transaction data available to export.');
        return;
      }

      const jsonString = JSON.stringify(transactions, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = globalThis.document?.createElement('a');
        if (!link) return;
        link.href = url;
        link.download = 'ExpenseZ_Backup.json';
        globalThis.document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Local Backup downloaded successfully!', 'success');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + 'ExpenseZ_Backup.json';
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export ExpenseZ Local Backup',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Backup sharing is not supported on this platform.');
      }
    } catch (error: any) {
      console.error('[Settings] Export backup error:', error);
      Alert.alert('Export Failed', error?.message || 'Could not export local backup.');
    }
  };

  const handleRestoreLocalBackup = async () => {
    try {
      let fileContent = '';

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        const filePromise = new Promise<string>((resolve, reject) => {
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve(event.target?.result as string);
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
          };
          input.onerror = () => reject(new Error('File chooser error'));
        });

        input.click();
        fileContent = await filePromise;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          showToast('Restore cancelled', 'info');
          return;
        }

        const asset = result.assets[0];
        fileContent = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      if (!fileContent) {
        Alert.alert('Restore Failed', 'Selected file is empty.');
        return;
      }

      const restoredTransactions = JSON.parse(fileContent);
      if (!Array.isArray(restoredTransactions)) {
        throw new Error('Invalid backup format: Must be a list of transactions.');
      }

      if (restoredTransactions.length > 0) {
        const first = restoredTransactions[0];
        if (first.amount === undefined || !first.type || !first.category) {
          throw new Error('Invalid backup file: Missing transaction fields.');
        }
      }

      Alert.alert(
        'Restore Backup',
        `Are you sure you want to overwrite all local transaction data with the selected backup file containing ${restoredTransactions.length} transactions?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                setSyncing(true);
                await AsyncStorage.setItem('@expensez_transactions', JSON.stringify(restoredTransactions));
                useStore.getState().setTransactions(restoredTransactions);
                await useStore.getState().getUserStats();
                showToast('Local backup restored successfully!', 'success');
              } catch (error: any) {
                Alert.alert('Restore Failed', error?.message || 'Could not save restored data.');
              } finally {
                setSyncing(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('[Settings] Restore local backup error:', error);
      Alert.alert('Restore Failed', error?.message || 'Could not parse or load local backup file.');
    }
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
              showToast('Logged out successfully', 'success');
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
    modalCard: {
      width: '85%',
      borderRadius: Metrics.borderRadius.xl,
      padding: Metrics.xl,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Metrics.fontSizes.lg,
      marginBottom: Metrics.xs,
    },
    modalSubtitle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.sm,
      marginBottom: Metrics.md,
    },
    inputLabel: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Metrics.fontSizes.xs,
      marginBottom: Metrics.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    textInput: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Metrics.fontSizes.md,
      paddingVertical: Metrics.sm,
      paddingHorizontal: Metrics.md,
      borderWidth: 1,
      borderRadius: Metrics.borderRadius.md,
      width: '100%',
    },
    modalButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: '100%',
      gap: Metrics.md,
    },
    modalButton: {
      paddingVertical: Metrics.sm + 2,
      paddingHorizontal: Metrics.lg,
      borderRadius: Metrics.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    modalButtonText: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Metrics.fontSizes.md,
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
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
              <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
              <Text 
                style={styles.profileEmail}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {isGuest ? 'Offline Mode (Local Storage)' : user?.email}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Sync & Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Data Management</Text>
          <Card style={{ padding: Metrics.sm, backgroundColor: Colors.light.card }}>
            {syncing && (
              <View style={{ flexDirection: 'row', padding: Metrics.md, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary[600]} style={{ marginRight: Metrics.sm }} />
                <Text style={{ fontFamily: Typography.fontFamily.medium, color: Colors.primary[600] }}>Syncing with Google Drive...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleBackupToGoogleDrive(false)}
              disabled={syncing}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.primary[50] }]}>
                <Upload size={Metrics.iconSize.md} color={Colors.primary[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Backup to Google Drive</Text>
                <Text style={styles.settingValue}>Upload local transactions as a CSV backup</Text>
              </View>
              <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
            </TouchableOpacity>

            <View style={styles.settingItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: '#f0f9ff' }]}>
                <RefreshCw size={Metrics.iconSize.md} color="#0284c7" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Auto-Sync Daily</Text>
                <Text style={styles.settingValue}>
                  {lastSyncTime ? `Last synced: ${formatLastSyncTime(lastSyncTime)}` : 'Automatically sync to Drive once a day'}
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={toggleAutoSync}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[300] }}
                thumbColor={autoSync ? Colors.primary[600] : Colors.gray[400]}
                disabled={syncing}
              />
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleRestoreFromGoogleDrive}
              disabled={syncing}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.secondary ? Colors.secondary[50] : '#fdf2f8' }]}>
                <Download size={Metrics.iconSize.md} color={Colors.secondary ? Colors.secondary[600] : '#db2777'} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Restore from Google Drive</Text>
                <Text style={styles.settingValue}>Overwrite local transactions with Drive CSV</Text>
              </View>
              <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleExportLocalJSON}
              disabled={syncing}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#eff6ff' }]}>
                <FileText size={Metrics.iconSize.md} color="#2563eb" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Export Local Backup</Text>
                <Text style={styles.settingValue}>Save/Share transactions as a backup file</Text>
              </View>
              <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleRestoreLocalBackup}
              disabled={syncing}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#f5f3ff' }]}>
                <Database size={Metrics.iconSize.md} color="#7c3aed" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Restore from Local Backup</Text>
                <Text style={styles.settingValue}>Select a backup file on your device to restore transactions</Text>
              </View>
              <ChevronRight size={Metrics.iconSize.md} color={Colors.gray[400]} />
            </TouchableOpacity>
          </Card>
        </View>
        
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

          {/* FD, EMI & SIP Tracker */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/active-tracker' as any)}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: '#f5f3ff' }]}>
              <RefreshCw size={Metrics.iconSize.md} color="#7c3aed" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>FD, EMI & SIP Tracker</Text>
              <Text style={styles.settingValue}>Track active fixed deposits and recurring commitments</Text>
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

      {/* Edit Profile Modal */}
      <Modal
        transparent
        visible={isEditProfileVisible}
        animationType="fade"
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <Pressable 
          style={styles.menuOverlay} 
          onPress={() => setIsEditProfileVisible(false)}
        >
          <Pressable 
            style={[styles.modalCard, { backgroundColor: Colors.light.card, borderColor: Colors.light.border }]} 
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: Colors.light.text }]}>Edit Name</Text>
            <Text style={[styles.modalSubtitle, { color: Colors.gray[500] }]}>Update your display name.</Text>

            <View style={{ width: '100%', marginTop: Metrics.md, marginBottom: Metrics.lg }}>
              <Text style={[styles.inputLabel, { color: Colors.gray[600] }]}>Display Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  color: Colors.light.text, 
                  borderColor: Colors.light.border, 
                  backgroundColor: Colors.light.input 
                }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter name"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.gray[100] }]}
                onPress={() => setIsEditProfileVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: Colors.gray[700] }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary[600] }]}
                onPress={handleSaveProfile}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}