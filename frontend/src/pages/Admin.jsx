import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency } from '../utils/formatters';

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState({ name: '', numberOfWinners: 10, rewards: [{ position: 1, name: '1st Prize', amount: 500, winnersCount: 1 }] });

  useEffect(() => {
    api.get('/api/v1/admin/overview').then((r) => setOverview(r.data));
    api.get('/api/v1/admin/rewards').then((r) => setRewards(r.data.data || []));
  }, []);

  async function saveReward(e) {
    e.preventDefault();
    await api.post('/api/v1/admin/rewards', form);
    const r = await api.get('/api/v1/admin/rewards');
    setRewards(r.data.data || []);
  }

  async function runDraw(raffleId) {
    const res = await api.post(`/api/v1/admin/draws/${raffleId}`);
    alert(`Draw complete! ${res.data.winners?.length} winners selected.`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {overview && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card><p className="text-sm text-slate-500">Users</p><p className="text-3xl font-bold">{overview.totalUsers}</p></Card>
          <Card><p className="text-sm text-slate-500">Raffles</p><p className="text-3xl font-bold">{overview.totalRaffles}</p></Card>
          <Card><p className="text-sm text-slate-500">Revenue</p><p className="text-3xl font-bold">{formatCurrency(overview.totalRevenue)}</p></Card>
          <Card>
            <p className="text-sm text-slate-500">Active Round</p>
            <p className="text-lg font-bold">#{overview.activeRaffle?.roundNumber || '-'}</p>
            {overview.activeRaffle && (
              <button onClick={() => runDraw(overview.activeRaffle._id)} className="text-sm text-primary mt-2 hover:underline">Execute Draw</button>
            )}
          </Card>
        </div>
      )}

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">Reward Configuration</h2>
        <form onSubmit={saveReward} className="space-y-4">
          <input placeholder="Config name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 w-full" required />
          <input type="number" placeholder="Number of rewarded persons" value={form.numberOfWinners} onChange={(e) => setForm({ ...form, numberOfWinners: parseInt(e.target.value, 10) })} className="border rounded-lg px-3 py-2 w-full" />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Save Reward Config</button>
        </form>
        <div className="mt-4 space-y-2">
          {rewards.map((r) => (
            <div key={r._id} className="flex justify-between text-sm border-b py-2">
              <span>{r.name} — {r.numberOfWinners} winners</span>
              <span>{formatCurrency(r.totalRewardPool)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
