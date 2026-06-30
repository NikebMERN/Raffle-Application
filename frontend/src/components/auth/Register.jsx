import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {['firstName', 'lastName', 'username', 'email', 'password'].map((f) => (
            <input key={f} type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'} placeholder={f} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          ))}
          <Button type="submit" className="w-full">Register</Button>
        </form>
      </Card>
    </div>
  );
}
