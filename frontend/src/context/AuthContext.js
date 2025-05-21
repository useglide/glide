'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
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
    <AuthContext.Provider value={{ user, login, signup, logout, loginWithToken }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
