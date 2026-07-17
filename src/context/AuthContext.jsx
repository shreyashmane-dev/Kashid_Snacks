import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  signInWithPopup, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseMock } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Helper to determine if a user has admin privileges
  const checkAdminPrivileges = async (user) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    // Check if email is explicitly listed in VITE_ADMIN_EMAILS or matches mock admin
    const envAdminEmails = [
      'admin@kashidsnacks.com',
      ...(import.meta.env.VITE_ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
    ].filter(Boolean);

    const isEmailAdmin = envAdminEmails.includes(user.email?.toLowerCase());

    if (isEmailAdmin) {
      setIsAdmin(true);
      // In live Firebase, automatically verify/upsert their document as admin role
      if (!isFirebaseMock) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Kashid Admin',
              role: 'admin',
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (e) {
          console.error("Auto-upsert admin failed:", e);
        }
      }
      return;
    }

    if (isFirebaseMock) {
      setIsAdmin(false);
      return;
    }

    // In live Firebase, check Firestore users collection role field
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin privileges:", error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (isFirebaseMock) {
      // Load mock user from localStorage if exists
      const savedMockUser = localStorage.getItem('mock_user');
      if (savedMockUser) {
        const parsedUser = JSON.parse(savedMockUser);
        setCurrentUser(parsedUser);
        checkAdminPrivileges(parsedUser);
      }
      setLoading(false);
      return;
    }

    let unsubSnapshot = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clear any existing user document snapshot listener
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (user) {
        setCurrentUser(user);
        
        // Check if email is explicitly listed in VITE_ADMIN_EMAILS
        const envAdminEmails = [
          'admin@kashidsnacks.com',
          ...(import.meta.env.VITE_ADMIN_EMAILS || '')
            .split(',')
            .map(e => e.trim().toLowerCase())
        ].filter(Boolean);

        const isEmailAdmin = envAdminEmails.includes(user.email?.toLowerCase());

        if (isEmailAdmin) {
          setIsAdmin(true);
          // Auto-upsert admin role
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Kashid Admin',
                role: 'admin',
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          } catch (e) {
            console.error("Auto-upsert admin failed:", e);
          }
        } else {
          // Set up real-time listener on the user's firestore document
          const userDocRef = doc(db, 'users', user.uid);
          unsubSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }, (error) => {
            console.error("Error in real-time user role check:", error);
            setIsAdmin(false);
          });
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubSnapshot) {
        unsubSnapshot();
      }
    };
  }, []);

  // MOCK ACTIONS
  const mockLogin = async (email, password) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Latency
    
    const envAdminEmails = [
      'admin@kashidsnacks.com',
      ...(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
    ].filter(Boolean);

    const isAdminUser = envAdminEmails.includes(email.toLowerCase());
    const user = { 
      uid: `mock-uid-${email.replace(/[^a-zA-Z0-9]/g, '')}`, 
      email, 
      displayName: isAdminUser ? 'Kashid Admin' : 'Snack Lover', 
      photoURL: null 
    };
    setCurrentUser(user);
    setIsAdmin(isAdminUser);
    localStorage.setItem('mock_user', JSON.stringify(user));
    setLoading(false);
    return user;
  };

  const mockSignup = async (email, password, displayName) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const envAdminEmails = [
      'admin@kashidsnacks.com',
      ...(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
    ].filter(Boolean);

    const isAdminUser = envAdminEmails.includes(email.toLowerCase());
    const user = { 
      uid: `mock-uid-${Date.now()}`, 
      email, 
      displayName, 
      photoURL: null 
    };
    setCurrentUser(user);
    setIsAdmin(isAdminUser);
    localStorage.setItem('mock_user', JSON.stringify(user));
    setLoading(false);
    return user;
  };

  const mockLogout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('mock_user');
    setLoading(false);
  };

  // LIVE ACTIONS
  const signup = async (email, password, displayName) => {
    if (isFirebaseMock) return mockSignup(email, password, displayName);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save additional profile info in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'customer',
      createdAt: new Date().toISOString(),
      addresses: [],
      wishlist: []
    });

    return user;
  };

  const login = async (email, password) => {
    if (isFirebaseMock) return mockLogin(email, password);
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  };

  const loginWithGoogle = async () => {
    if (isFirebaseMock) {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const user = { uid: 'mock-google-uid', email: 'googleuser@gmail.com', displayName: 'Google User', photoURL: null };
      setCurrentUser(user);
      setIsAdmin(false);
      localStorage.setItem('mock_user', JSON.stringify(user));
      setLoading(false);
      return user;
    }
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document already exists, if not, create it
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        role: 'customer',
        createdAt: new Date().toISOString(),
        addresses: [],
        wishlist: []
      });
    }
    return user;
  };

  const logout = async () => {
    if (isFirebaseMock) return mockLogout();
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email) => {
    if (isFirebaseMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Mock reset password email sent to ${email}`);
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const verifyPhoneOTP = async (phoneNumber) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Mock phone OTP requested for ${phoneNumber}`);
    return {
      confirm: async (code) => {
        if (code === "123456") {
          const user = { uid: 'mock-phone-uid', email: 'phoneuser@kashidsnacks.com', displayName: 'Phone User', phoneNumber };
          setCurrentUser(user);
          setIsAdmin(false);
          localStorage.setItem('mock_user', JSON.stringify(user));
          return user;
        } else {
          throw new Error("Invalid OTP code. Try 123456");
        }
      }
    };
  };

  // Re-check admin status from Firestore without logging out/in
  const refreshAdmin = async () => {
    if (currentUser) {
      await checkAdminPrivileges(currentUser);
    }
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    login,
    signup,
    logout,
    loginWithGoogle,
    resetPassword,
    verifyPhoneOTP,
    refreshAdmin,
    isMock: isFirebaseMock
  };


  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
