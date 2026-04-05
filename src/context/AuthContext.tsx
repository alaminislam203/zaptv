'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setUser(user);
      if (user) {
        // Fetch additional user data
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Proactively update role to ADMIN for the designated email
          if (user.email === 'ai729776@gmail.com' && data.role !== 'ADMIN') {
            const updatedData = { ...data, role: 'ADMIN' };
            await setDoc(userDocRef, updatedData);
            setUserData(updatedData);
          } else {
            setUserData(data);
          }
        } else {
          // Initialize if not exists
          const isAdmin = user.email === 'ai729776@gmail.com';
          const initialData = {
            name: user.displayName || 'User',
            email: user.email,
            role: isAdmin ? 'ADMIN' : 'USER',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, initialData);
          setUserData(initialData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
