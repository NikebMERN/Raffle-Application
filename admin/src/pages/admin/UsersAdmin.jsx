import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = ['user', 'admin', 'super_admin'];

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load(term = '') {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/users', { params: { search: term, limit: 100 } });
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id, role) {
    setBusyId(id);
    setError('');
    try {
      await api.post(`/api/v1/users/${id}/role`, { role });
      await load(search);
    } catch (err) {
      setError(err.message || 'Could not change role');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleBan(u) {
    if (u.isActive === false) return; // re-activation handled via role/update elsewhere
    if (!window.confirm(`Ban ${u.email}? They will lose access.`)) return;
    setBusyId(u._id);
    setError('');
    try {
      await api.post(`/api/v1/users/${u._id}/ban`);
      await load(search);
    } catch (err) {
      setError(err.message || 'Could not ban user');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <p className="text-slate-500 text-sm mt-1">Search members, manage roles and access.</p>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <Card>
        <form
          className="flex gap-3 mb-4"
          onSubmit={(e) => { e.preventDefault(); load(search); }}
        >
          <input
            className="input flex-1"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Wallet</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Last login</th>
                  <th className="py-2 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {u.photoURL && <img src={u.photoURL} alt="" className="w-7 h-7 rounded-full" />}
                        <div>
                          <Link to={`/admin/users/${u._id}`} className="font-medium hover:text-primary hover:underline">
                            {u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}
                          </Link>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className="border rounded-lg px-2 py-1 text-sm disabled:opacity-50"
                        value={u.role}
                        disabled={busyId === u._id || u._id === me?._id}
                        onChange={(e) => changeRole(u._id, e.target.value)}
                      >
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-4">{formatCurrency(u.walletBalance || 0)}</td>
                    <td className="py-3 pr-4">
                      {u.isActive === false
                        ? <span className="text-red-600 text-xs font-medium">banned</span>
                        : <span className="text-green-700 text-xs font-medium">active</span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-500">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</td>
                    <td className="py-3 pr-0 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link to={`/admin/users/${u._id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        {u._id !== me?._id && u.isActive !== false && (
                          <Button variant="danger" size="sm" disabled={busyId === u._id} onClick={() => toggleBan(u)}>Ban</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr><td colSpan="6" className="py-6 text-center text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
