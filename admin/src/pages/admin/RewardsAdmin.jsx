import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatters';

const newTier = (position) => ({ position, name: `${position}. Prize`, amount: 100, winnersCount: 1 });

export default function RewardsAdmin() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [tiers, setTiers] = useState([newTier(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/admin/rewards', { params: { limit: 100 } });
      setRewards(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const numberOfWinners = tiers.reduce((s, t) => s + Number(t.winnersCount || 0), 0);
  const totalPool = tiers.reduce((s, t) => s + Number(t.amount || 0) * Number(t.winnersCount || 0), 0);

  function updateTier(i, field, value) {
    setTiers((arr) => arr.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }
  function addTier() {
    setTiers((arr) => [...arr, newTier(arr.length + 1)]);
  }
  function removeTier(i) {
    setTiers((arr) => arr.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, position: idx + 1 })));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/api/v1/admin/rewards', {
        name,
        numberOfWinners,
        rewards: tiers.map((t) => ({
          position: Number(t.position),
          name: t.name,
          amount: Number(t.amount),
          winnersCount: Number(t.winnersCount),
        })),
      });
      setName('');
      setTiers([newTier(1)]);
      await load();
    } catch (err) {
      setError(err.message || 'Could not save reward config');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this reward config?')) return;
    await api.delete(`/api/v1/admin/rewards/${id}`);
    await load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Rewards</h1>
        <p className="text-slate-500 text-sm mt-1">Define prize tiers and winner pools.</p>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">New reward configuration</h2>
        <form onSubmit={save} className="space-y-4">
          <input className="input" placeholder="Config name" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-sm text-slate-500 text-center">#{t.position}</span>
                <input className="col-span-5 border rounded-lg px-2 py-1.5 text-sm" placeholder="Prize name" value={t.name} onChange={(e) => updateTier(i, 'name', e.target.value)} required />
                <input className="col-span-3 border rounded-lg px-2 py-1.5 text-sm" type="number" min="0" step="0.01" placeholder="Amount" value={t.amount} onChange={(e) => updateTier(i, 'amount', e.target.value)} />
                <input className="col-span-2 border rounded-lg px-2 py-1.5 text-sm" type="number" min="1" placeholder="# winners" value={t.winnersCount} onChange={(e) => updateTier(i, 'winnersCount', e.target.value)} />
                <button type="button" className="col-span-1 text-red-500 hover:text-red-700" onClick={() => removeTier(i)} disabled={tiers.length === 1}>✕</button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addTier} className="text-sm text-primary hover:underline">+ Add tier</button>

          <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-4 py-3">
            <span>Total winners: <strong>{numberOfWinners}</strong></span>
            <span>Total pool: <strong>{formatCurrency(totalPool)}</strong></span>
          </div>

          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save reward config'}</Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Existing configurations</h2>
        {loading ? <Spinner /> : (
          <div className="space-y-2">
            {rewards.map((r) => (
              <div key={r._id} className="flex items-center justify-between border-b last:border-0 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-slate-500">{r.numberOfWinners} winners · {formatCurrency(r.totalRewardPool)}</p>
                </div>
                <Button variant="secondary" onClick={() => remove(r._id)}>Delete</Button>
              </div>
            ))}
            {!rewards.length && <p className="text-slate-400 text-center py-6">No reward configs yet.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
