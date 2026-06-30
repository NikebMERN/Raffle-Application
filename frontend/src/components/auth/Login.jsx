import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', twoFactorCode: '' });
  const [error, setError] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password, form.twoFactorCode || undefined);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === '2FA_REQUIRED') setNeeds2fa(true);
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          {needs2fa && <input type="text" placeholder="2FA Code" value={form.twoFactorCode} onChange={(e) => setForm({ ...form, twoFactorCode: e.target.value })} className="w-full border rounded-lg px-3 py-2" />}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </Card>
    </div>
  );
}
