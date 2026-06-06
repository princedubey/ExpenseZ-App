import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Function to resolve GoogleSignin and retrieve tokens safely
export const getGoogleAccessToken = async (): Promise<string | null> => {
  if (isExpoGo || Platform.OS === 'web') {
    // For Expo Go / Web testing, we return a mock token for development convenience.
    console.warn('Google Drive sync requires a native development build. Using mock token for simulation.');
    return 'mock_access_token';
  }

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    let isSignedIn = await GoogleSignin.isSignedIn();
    if (!isSignedIn) {
      try {
        console.log('[Google Drive] User not natively signed in. Attempting silent sign-in...');
        await GoogleSignin.signInSilently();
        isSignedIn = await GoogleSignin.isSignedIn();
      } catch (silentError) {
        console.error('[Google Drive] Silent sign-in failed:', silentError);
      }
    }

    if (!isSignedIn) {
      console.warn('[Google Drive] No active Google Sign-In session found.');
      return null;
    }
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch (error) {
    console.error('[Google Drive] Error fetching access token:', error);
    return null;
  }
};

const BACKUP_FILE_NAME = 'ExpenseZ_Backup.csv';

// Search for the backup file on Google Drive
export const findBackupFile = async (accessToken: string): Promise<string | null> => {
  if (accessToken === 'mock_access_token') {
    return 'mock_file_id';
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}'+and+trashed=false&spaces=drive&fields=files(id,name)`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to query files: ${response.status} ${errText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('[Google Drive] findBackupFile error:', error);
    throw error;
  }
};

// Download backup CSV contents
export const downloadBackupFile = async (accessToken: string, fileId: string): Promise<string> => {
  if (accessToken === 'mock_file_id' || accessToken === 'mock_access_token') {
    // Return empty string for simulated flow
    return '';
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to download backup: ${response.status} ${errText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('[Google Drive] downloadBackupFile error:', error);
    throw error;
  }
};

// Create or update backup CSV on Google Drive
export const uploadBackupFile = async (
  accessToken: string,
  csvContent: string,
  fileId?: string | null
): Promise<string> => {
  if (accessToken === 'mock_access_token' || accessToken === 'mock_file_id') {
    console.log('[Google Drive] Mock CSV sync success (content length:', csvContent.length, ')');
    return 'mock_file_id';
  }

  try {
    if (fileId) {
      // Update existing file content
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/csv',
          },
          body: csvContent,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update backup file: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return data.id || fileId;
    } else {
      // Create a new file with metadata and content using a multipart upload
      const boundary = 'foo_bar_baz';
      const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'text/csv',
      };

      const body = [
        `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
        `\r\n--${boundary}\r\nContent-Type: text/csv\r\n\r\n${csvContent}`,
        `\r\n--${boundary}--`,
      ].join('');

      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
            'Content-Length': String(body.length),
          },
          body,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create backup file: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return data.id;
    }
  } catch (error) {
    console.error('[Google Drive] uploadBackupFile error:', error);
    throw error;
  }
};
