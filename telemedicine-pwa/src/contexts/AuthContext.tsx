import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import type { User } from '@/types';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmOTP: (code: string) => Promise<void>;
  error: string | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const setupRecaptcha = (elementId: string) => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        // Callback after reCAPTCHA verification
      }
    });
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      setupRecaptcha('recaptcha-container');
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      return confirmationResult;
    } catch (error) {
      console.error('Error in signInWithPhone:', error);
      setError('Error sending verification code');
      throw error;
    }
  };

  const confirmOTP = async (code: string) => {
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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithPhone,
      confirmOTP,
      signOut,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);