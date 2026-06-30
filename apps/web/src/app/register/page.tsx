'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-bold mb-6">Create Account</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {(['firstName', 'lastName', 'email', 'phone', 'password'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' : field}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required={field !== 'phone'}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register'}
            </button>
          </form>
          <p className="text-sm text-slate-500 mt-4 text-center">
            Have an account? <Link href="/login" className="text-primary">Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
