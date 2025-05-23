// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Add scopes needed for Google Drive and other Google services
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/presentations');

// Helper function to sign in with Google popup
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Helper function to sign in with Google redirect
const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error redirecting to Google sign-in:", error);
    throw error;
  }
};

// Helper function to get Google OAuth token from Firebase user
const getGoogleOAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Check if user is signed in with Google
    const isGoogleUser = user.providerData.some(
      provider => provider.providerId === GoogleAuthProvider.PROVIDER_ID
    );

    if (!isGoogleUser) {
      throw new Error("User is not signed in with Google");
    }

    // Get the user's ID token
    const idToken = await user.getIdToken(true);

    // For now, we'll use the Firebase ID token as a placeholder
    // The backend will need to use this token to get a Google OAuth token
    console.log("Retrieved Firebase ID token for Google-authenticated user");

    return {
      accessToken: idToken,  // Using Firebase ID token as a placeholder
      idToken: idToken
    };
  } catch (error) {
    console.error("Error getting Google OAuth token:", error);
    throw error;
  }
};

export {
  auth,
  db,
  googleProvider,
  signInWithGoogle,
  signInWithGoogleRedirect,
  getGoogleOAuthToken,
  getRedirectResult
};
