import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PasswordInput from '../../components/common/PasswordInput';

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Current password is incorrect.';
  if (code.includes('weak-password')) return 'New password is too weak (min 6 characters).';
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  if (code.includes('requires-recent-login')) return 'Please sign out and back in, then try again.';
  return err?.message || 'Something went wrong.';
}

export default function AccountAdmin() {
  const { user, updateDisplayName, changePassword } = useAuth();

  const [name, setName] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [nameErr, setNameErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  async function saveName(e) {
    e.preventDefault();
    setNameMsg('');
    setNameErr('');
    if (!name.trim()) { setNameErr('Username cannot be empty.'); return; }
    setSavingName(true);
    try {
      await updateDisplayName(name.trim());
      setNameMsg('Username updated.');
    } catch (err) {
      setNameErr(friendlyError(err));
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (newPassword.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwErr('New passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(friendlyError(err));
    } finally {
      setSavingPw(false);
    }
  }

  const inputClass = 'input mt-1.5';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Account</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your admin username and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold mb-1">Username</h2>
          <p className="text-sm text-slate-500 mb-4">Signed in as <span className="font-medium">{user?.email}</span></p>
          {nameMsg && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{nameMsg}</p>}
          {nameErr && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{nameErr}</p>}
          <form onSubmit={saveName} className="space-y-4">
            <label className="block text-sm">
              Display name
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <Button type="submit" disabled={savingName}>{savingName ? 'Saving…' : 'Save username'}</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold mb-1">Password</h2>
          <p className="text-sm text-slate-500 mb-4">Enter your current password to set a new one.</p>
          {pwMsg && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{pwMsg}</p>}
          {pwErr && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{pwErr}</p>}
          <form onSubmit={savePassword} className="space-y-4">
            <label className="block text-sm">
              Current password
              <div className="mt-1">
                <PasswordInput autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
            </label>
            <label className="block text-sm">
              New password
              <div className="mt-1">
                <PasswordInput autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
            </label>
            <label className="block text-sm">
              Confirm new password
              <div className="mt-1">
                <PasswordInput autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </label>
            <Button type="submit" disabled={savingPw}>{savingPw ? 'Updating…' : 'Change password'}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
