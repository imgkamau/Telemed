import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export const signup = async (email: string, password: string) => {
  if (!auth) throw new Error('Auth not initialized');
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return { user: userCredential.user };
}; 