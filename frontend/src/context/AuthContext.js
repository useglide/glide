'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signInWithGoogleRedirect,
  getRedirectResult,
  getGoogleOAuthToken
} from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleAuthReady, setGoogleAuthReady] = useState(false);

  // Check for Google redirect result on initial load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        // Check if we have a redirect result from Google sign-in
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in with Google redirect
          console.log("Google sign-in redirect successful");

          // The user info is handled by the onAuthStateChanged listener
          setGoogleAuthReady(true);
        }
      } catch (error) {
        console.error("Error processing Google redirect result:", error);
      }
    };

    checkRedirectResult();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if user has Google provider
        const hasGoogleProvider = user.providerData.some(
          provider => provider.providerId === GoogleAuthProvider.PROVIDER_ID
        );

        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          hasGoogleProvider: hasGoogleProvider
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithToken = (token) => {
    return signInWithCustomToken(auth, token);
  };

  // Google sign-in with popup
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      return result;
    } catch (error) {
      console.error("Error signing in with Google popup:", error);
      throw error;
    }
  };

  // Google sign-in with redirect
  const loginWithGoogleRedirect = async () => {
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error("Error signing in with Google redirect:", error);
      throw error;
    }
  };

  // Get Google OAuth token for the current user
  const getGoogleToken = async () => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!user.hasGoogleProvider) {
        throw new Error("User is not authenticated with Google");
      }

      return await getGoogleOAuthToken();
    } catch (error) {
      console.error("Error getting Google token:", error);
      throw error;
    }
  };

  const logout = async () => {
    // Clear user state
    setUser(null);

    // Clear any cached data by invalidating the cache
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        // Try to clear the Next.js data cache
        const cacheKeys = await window.caches.keys();
        for (const key of cacheKeys) {
          // Only clear caches that might contain user data
          if (key.includes('next-data') || key.includes('api-cache')) {
            await window.caches.delete(key);
            console.log(`Cleared cache: ${key}`);
          }
        }
        console.log('Cache cleared on logout');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }

    // Sign out from Firebase
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      loginWithToken,
      loginWithGoogle,
      loginWithGoogleRedirect,
      getGoogleToken,
      googleAuthReady
    }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
