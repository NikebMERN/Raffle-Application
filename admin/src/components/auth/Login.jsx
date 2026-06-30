import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Card from '../common/Card';
import Button from '../common/Button';
import PasswordInput from '../common/PasswordInput';

export default function Login() {
  const { loginWithEmail, sendReset, user, isAdmin, configured } = useAuth();
  const { clubName } = useConfig();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && isAdmin) navigate('/admin');
  }, [user, isAdmin, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError('Enter your email first, then click "Forgot password".');
      return;
    }
    setError('');
    setInfo('');
    try {
      await sendReset(email.trim());
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-100 to-primary-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-primary text-white font-display font-bold text-xl shadow-glow">
            {clubName?.[0] || 'F'}
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">{clubName} Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Restricted area — sign in with your admin credentials.</p>
        </div>

        <Card>
          {!configured && (
            <p className="mb-4 rounded-xl bg-amber-50 text-amber-700 text-sm px-3 py-2.5">
              Firebase is not configured yet. Add your VITE_FIREBASE_* values to admin/.env.
            </p>
          )}
          {user && !isAdmin && (
            <p className="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-3 py-2.5">
              This account ({user.email}) is not an administrator.
            </p>
          )}
          {error && <p className="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-3 py-2.5">{error}</p>}
          {info && <p className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm px-3 py-2.5">{info}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="username"
                className="input mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <div className="mt-1.5">
                <PasswordInput
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>
            <Button type="submit" loading={busy} disabled={!configured} size="lg" className="w-full">
              Sign in
            </Button>
          </form>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Forgot password?
          </button>
        </Card>
      </div>
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Invalid email or password.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Try again later or reset your password.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is not enabled in Firebase Console.';
  }
  return err?.message || 'Sign-in failed';
}
