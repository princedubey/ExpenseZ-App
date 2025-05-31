import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Get this from your Google Cloud Console
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });
}; 