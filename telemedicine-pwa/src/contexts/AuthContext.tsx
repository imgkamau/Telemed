import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import type { User } from '@/types';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyCode: (confirmationResult: ConfirmationResult, code: string) => Promise<any>;
  signOut: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Clear any existing reCAPTCHA
      if ((window as any).recaptchaVerifier) {
        await (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
      
      // Create new reCAPTCHA instance
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',  // Changed to invisible
        callback: (response: any) => {
          console.log('reCAPTCHA response:', response);
        }
      });
      
      // Render before using
      await verifier.render();
      (window as any).recaptchaVerifier = verifier;
      
      return await signInWithPhoneNumber(auth, formattedNumber, verifier);
    } catch (error: any) {
      console.error('Firebase error:', error);
      throw error;
    }
  };

  const verifyCode = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      if (!window.confirmationResult) {
        throw new Error('No confirmation result found');
      }
      const result = await window.confirmationResult.confirm(code);
      setUser(result.user);
      router.push('/chat'); // Redirect to chat after successful verification
    } catch (error) {
      console.error('Error confirming OTP:', error);
      setError('Invalid verification code');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Error signing out');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || '',  // Add phoneNumber with fallback
      } : null);
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
    error
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