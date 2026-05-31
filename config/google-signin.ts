import Constants from 'expo-constants';
import googleServices from '../google-services.json';

let googleSigninModule: any | null = null;

const isExpoGo = Constants.appOwnership === 'expo';

const getGoogleSignin = () => {
  if (isExpoGo) {
    return null;
  }

  if (!googleSigninModule) {
    googleSigninModule = require('@react-native-google-signin/google-signin').GoogleSignin;
  }

  return googleSigninModule;
};

const webClientId = (() => {
  try {
    const client = googleServices.client?.[0];
    const oauth = client?.oauth_client?.find((c: any) => c.client_type === 3) || client?.oauth_client?.[0];
    return oauth?.client_id || 'YOUR_WEB_CLIENT_ID';
  } catch (e) {
    return 'YOUR_WEB_CLIENT_ID';
  }
})();

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