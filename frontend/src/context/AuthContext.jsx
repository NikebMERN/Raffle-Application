import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithGoogle as firebaseSignInWithGoogle,
  completeRedirectSignIn,
  signOutUser,
} from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return undefined;
    }
    const auth = getFirebaseAuth();
    // If we returned from a redirect-based sign-in, finish it before listening.
    completeRedirectSignIn();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const res = await api.post('/api/v1/auth/session');
          setUser(res.data);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [configured]);

  const loginWithGoogle = async () => {
    await firebaseSignInWithGoogle();
    // onAuthStateChanged will sync the backend profile and populate `user`.
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignore network errors during logout.
    }
    await signOutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshProfile = async () => {
    const res = await api.get('/api/v1/auth/me');
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        configured,
        loginWithGoogle,
        logout,
        refreshProfile,
        isAdmin: ['admin', 'super_admin'].includes(user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
