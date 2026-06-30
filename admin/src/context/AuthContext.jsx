import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithEmail,
  resetPassword,
  changeUserPassword,
  updateAuthDisplayName,
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

  const loginWithEmail = async (email, password) => {
    await signInWithEmail(email, password);
    // onAuthStateChanged will sync the backend profile and populate `user`.
  };

  const sendReset = async (email) => {
    await resetPassword(email);
  };

  // Update the admin's display name in Firebase Auth + the Firestore profile.
  const updateDisplayName = async (displayName) => {
    await updateAuthDisplayName(displayName);
    const res = await api.patch('/api/v1/auth/profile', { displayName });
    setUser(res.data);
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    await changeUserPassword(currentPassword, newPassword);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        configured,
        loginWithEmail,
        sendReset,
        updateDisplayName,
        changePassword,
        logout,
        isAdmin: ['admin', 'super_admin'].includes(user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
