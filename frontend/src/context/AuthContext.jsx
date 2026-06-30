import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/auth/me').then((r) => setUser(r.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (email, password, twoFactorCode) => {
    await api.post('/api/v1/auth/login', { email, password, twoFactorCode });
    const res = await api.get('/api/v1/auth/me');
    setUser(res.data);
    return res.data;
  };

  const register = async (data) => {
    await api.post('/api/v1/auth/register', data);
    const res = await api.get('/api/v1/auth/me');
    setUser(res.data);
  };

  const logout = async () => {
    await api.post('/api/v1/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: ['admin', 'super_admin'].includes(user?.role) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
