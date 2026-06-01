import { Platform } from 'react-native';
import Constants from 'expo-constants';
import googleServices from '../google-services.json';

let googleSigninModule: any | null = null;

const isExpoGo = Constants.appOwnership === 'expo';

const getGoogleSignin = () => {
  if (isExpoGo || Platform.OS === 'web') {
    return null;
  }

  if (!googleSigninModule) {
    googleSigninModule = require('@react-native-google-signin/google-signin').GoogleSignin;
  }

  return googleSigninModule;
};

export const webClientId = '129393014646-vtn4vfso08jc7o29ipsut5vur8s5co2s.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
  const GoogleSignin = getGoogleSignin();

  if (!GoogleSignin) {
    return false;
  }

  GoogleSignin.configure({
    webClientId,
  });

  return true;
};

export const isGoogleSignInAvailable = () => Boolean(getGoogleSignin());

export const signInWithGoogle = async (): Promise<any> => {
  const GoogleSignin = getGoogleSignin();

  if (!GoogleSignin) {
    throw new Error('Google Sign-In requires a development build, not Expo Go.');
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  return GoogleSignin.signIn() as any;
};