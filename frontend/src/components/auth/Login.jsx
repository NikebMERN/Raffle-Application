import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Card from '../common/Card';
import Button from '../common/Button';

export default function Login() {
  const { loginWithGoogle, user, configured } = useAuth();
  const { clubName } = useConfig();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-6">
        <span className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-primary text-white font-display font-bold text-xl shadow-glow">
          {clubName?.[0] || 'F'}
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">Welcome back</h1>
        <p className="text-slate-500 text-sm mt-1">Sign in to {clubName} Raffle to buy tickets and track your draws.</p>
      </div>

      <Card>
        {!configured && (
          <p className="mb-4 rounded-xl bg-amber-50 text-amber-700 text-sm px-3 py-2.5">
            Firebase is not configured yet. Add your VITE_FIREBASE_* values to frontend/.env.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-3 py-2.5">{error}</p>
        )}

        <Button
          onClick={handleGoogle}
          loading={busy}
          disabled={!configured}
          variant="outline"
          size="lg"
          className="w-full"
        >
          {!busy && (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
          )}
          {busy ? 'Signing in…' : 'Continue with Google'}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          By continuing you agree to play responsibly. 18+ only.
        </p>
      </Card>
    </div>
  );
}
