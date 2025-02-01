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
      // Format phone number if needed
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Setup reCAPTCHA
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA resolved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            (window as any).recaptchaVerifier = null;
          }
        });
      }

      // Log the attempt
      console.log('Attempting to send code to:', formattedNumber);
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        (window as any).recaptchaVerifier
      );

      return confirmationResult;
    } catch (error: any) {
      console.error('Firebase error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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