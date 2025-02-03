import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import type { User as FirebaseUser } from '@/types';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User as FirebaseUserAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface User {
  id: string;
  phoneNumber: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin';
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyCode: (confirmationResult: ConfirmationResult, code: string) => Promise<any>;
  signOut: () => Promise<void>;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createUserData = async (firebaseUser: FirebaseUserAuth) => {
    if (!db) throw new Error('Database not initialized');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();


    return {
      id: firebaseUser.uid,
      phoneNumber: firebaseUser.phoneNumber || '',
      email: firebaseUser.email || '',
      role: userData?.role || 'patient',
      specialization: userData?.specialization || ''
    };
  };

  const signInWithPhone = async (phoneNumber: string, retryCount = 0) => {
    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      if (retryCount > 0) {
        // Wait 5 seconds between retries
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      if (!auth) throw new Error('Auth not initialized');
      
      // Clear existing reCAPTCHA
      if ((window as any).recaptchaVerifier) {
        await (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
      
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => console.log('reCAPTCHA response:', response)
      });
      
      await verifier.render();
      (window as any).recaptchaVerifier = verifier;
      
      return await signInWithPhoneNumber(auth, formattedNumber, verifier);
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests' && retryCount < 2) {
        return signInWithPhone(phoneNumber, retryCount + 1);
      }
      throw error;
    }
  };

  const verifyCode = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      const result = await confirmationResult.confirm(code);
      const userData = await createUserData(result.user);

      setUser(userData);
      router.push('/chat');
    } catch (error) {
      console.error('Error confirming OTP:', error);
      setError('Invalid verification code');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!auth) throw new Error('Auth not initialized');
      await auth.signOut();
      setUser(null);
      router.push('/auth/login');

    } catch (error) {
      console.error('Error signing out:', error);
      setError('Error signing out');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error('Auth not initialized');
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await createUserData(result.user);
      

      setUser(userData);
    } catch (error: any) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error('Auth not initialized');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userData = await createUserData(result.user);
      setUser(userData);
    } catch (error: any) {

      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!auth) throw new Error('Auth not initialized');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userData = await createUserData(result.user);
      setUser(userData);

    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!auth) throw new Error('Auth not initialized');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userData = await createUserData(firebaseUser);
        
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signInWithPhone,
    verifyCode,
    signOut,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};