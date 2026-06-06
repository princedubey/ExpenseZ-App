import { Platform } from 'react-native';
import Constants from 'expo-constants';
import googleServices from '../google-services.json';

let googleSigninModule: any | null = null;

const isExpoGo = Constants.appOwnership === 'expo';

const getGoogleSignin = () => {
  if (isExpoGo || Platform.OS === 'web') {
    return null;
  }

  try {
    if (!googleSigninModule) {
      googleSigninModule = require('@react-native-google-signin/google-signin').GoogleSignin;
    }
    return googleSigninModule;
  } catch (e) {
    console.warn('Failed to require @react-native-google-signin/google-signin:', e);
    return null;
  }
};

export const webClientId = '129393014646-1g1vmu36bvbo9ps9dn28akliqohmkvsk.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
  try {
    const GoogleSignin = getGoogleSignin();

    if (!GoogleSignin) {
      return false;
    }

    GoogleSignin.configure({
      webClientId,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return true;
  } catch (e) {
    console.warn('Google Sign-In configure failed:', e);
    return false;
  }
};

export const isGoogleSignInAvailable = () => {
  try {
    return Boolean(getGoogleSignin());
  } catch (e) {
    return false;
  }
};

export const signInWithGoogle = async (): Promise<any> => {
  try {
    const GoogleSignin = getGoogleSignin();

    if (!GoogleSignin) {
      throw new Error('Google Sign-In requires a development build, not Expo Go.');
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    return GoogleSignin.signIn() as any;
  } catch (e) {
    console.error('signInWithGoogle native call failed:', e);
    throw e;
  }
};