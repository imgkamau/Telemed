import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import type { User } from '@/types';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithPhone: async () => { throw new Error('Not implemented') },
  verifyCode: async () => { throw new Error('Not implemented') },
  signOut: async () => { throw new Error('Not implemented') }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to our User type
        setUser({
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || '',
          name: firebaseUser.displayName || undefined,
          email: firebaseUser.email || undefined
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setupRecaptcha = (elementId: string) => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible'
      });
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    setupRecaptcha('recaptcha-container');
    return signInWithPhoneNumber(
      auth, 
      phoneNumber, 
      (window as any).recaptchaVerifier
    );
  };

  const verifyCode = async (confirmationResult: ConfirmationResult, code: string) => {
    await confirmationResult.confirm(code);
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithPhone, 
      verifyCode, 
      signOut 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);