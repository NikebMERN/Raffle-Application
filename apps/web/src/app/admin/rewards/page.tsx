'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/utils';

interface RewardTier {
  position: number;
  name: string;
  amount: number;
  winnersCount: number;
  description?: string;
}

interface RewardConfig {
  id: string;
  name: string;
  raffleId?: string;
  roundId?: string;
  numberOfWinners: number;
  totalRewardPool: number;
  rewards: RewardTier[];
  isActive: boolean;
  raffle?: { title: string };
  round?: { title: string };
  perWinnerBreakdown?: { position: number; name: string; amountPerPerson: number; winnersCount: number; subtotal: number }[];
}

const emptyTier = (): RewardTier => ({
  position: 1,
  name: '',
  amount: 0,
  winnersCount: 1,
  description: '',
});

export default function AdminRewardsPage() {
  const [configs, setConfigs] = useState<RewardConfig[]>([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    raffleId: '',
    roundId: '',
    numberOfWinners: 1,
    isActive: true,
    rewards: [emptyTier()] as RewardTier[],
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  function loadConfigs() {
    api<{ data: RewardConfig[] }>('/rewards')
      .then((r) => setConfigs(r.data))
      .catch(() => setMessage('Failed to load rewards — sign in as admin'));
  }

  function totalSlots() {
    return form.rewards.reduce((sum, r) => sum + (r.winnersCount || 0), 0);
  }

  function totalPool() {
    return form.rewards.reduce((sum, r) => sum + (r.amount || 0) * (r.winnersCount || 0), 0);
  }

  function addTier() {
    setForm({
      ...form,
      rewards: [
        ...form.rewards,
        { ...emptyTier(), position: form.rewards.length + 1 },
      ],
    });
  }

  function removeTier(index: number) {
    setForm({
      ...form,
      rewards: form.rewards.filter((_, i) => i !== index).map((r, i) => ({ ...r, position: i + 1 })),
    });
  }

  function updateTier(index: number, field: keyof RewardTier, value: string | number) {
    const rewards = [...form.rewards];
    rewards[index] = { ...rewards[index], [field]: value };
    setForm({ ...form, rewards });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: '',
      raffleId: '',
      roundId: '',
      numberOfWinners: 1,
      isActive: true,
      rewards: [emptyTier()],
    });
  }

  function startEdit(config: RewardConfig) {
    setEditingId(config.id);
    setForm({
      name: config.name,
      raffleId: config.raffleId || '',
      roundId: config.roundId || '',
      numberOfWinners: config.numberOfWinners,
      isActive: config.isActive,
      rewards: config.rewards.length ? config.rewards : [emptyTier()],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (totalSlots() !== form.numberOfWinners) {
      setMessage(`Winner slots (${totalSlots()}) must equal "Number of Rewarded Persons" (${form.numberOfWinners})`);
      return;
    }

    const payload = {
      name: form.name,
      raffleId: form.raffleId || undefined,
      roundId: form.roundId || undefined,
      numberOfWinners: form.numberOfWinners,
      isActive: form.isActive,
      rewards: form.rewards,
    };

    try {
      if (editingId) {
        await api(`/rewards/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setMessage('Reward configuration updated');
      } else {
        await api('/rewards', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Reward configuration created');
      }
      resetForm();
      loadConfigs();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reward configuration?')) return;
    await api(`/rewards/${id}`, { method: 'DELETE' });
    loadConfigs();
    setMessage('Deleted');
  }

  async function syncPrizes(id: string) {
    try {
      const res = await api<{ message: string }>(`/rewards/${id}/sync-prizes`, { method: 'POST' });
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Reward Management</h1>
      <p className="text-slate-500 mb-8">
        Control how many people are rewarded and the amount each winner receives.
      </p>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${message.includes('Failed') || message.includes('must') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Configs" value={configs.filter((c) => c.isActive).length} />
        <StatCard label="Total Winners (form)" value={form.numberOfWinners} />
        <StatCard label="Total Reward Pool (form)" value={`£${totalPool().toFixed(2)}`} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-8 space-y-6">
        <h2 className="font-semibold text-lg">{editingId ? 'Edit Reward Configuration' : 'Create Reward Configuration'}</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Configuration Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Season Finale Rewards"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Rewarded Persons</label>
            <input
              type="number"
              min={1}
              value={form.numberOfWinners}
              onChange={(e) => setForm({ ...form, numberOfWinners: parseInt(e.target.value) || 1 })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Total winner slots across all tiers: {totalSlots()}
              {totalSlots() !== form.numberOfWinners && (
                <span className="text-red-500"> — must match rewarded persons</span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Raffle ID (optional)</label>
            <input
              value={form.raffleId}
              onChange={(e) => setForm({ ...form, raffleId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="MongoDB ObjectId"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Round ID (optional)</label>
            <input
              value={form.roundId}
              onChange={(e) => setForm({ ...form, roundId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="MongoDB ObjectId"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Reward Tiers (amount per person)</h3>
            <button type="button" onClick={addTier} className="text-sm text-primary hover:underline">
              + Add Tier
            </button>
          </div>

          <div className="space-y-3">
            {form.rewards.map((tier, index) => (
              <div key={index} className="grid md:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="text-xs text-slate-500">Position</label>
                  <input
                    type="number"
                    min={1}
                    value={tier.position}
                    onChange={(e) => updateTier(index, 'position', parseInt(e.target.value) || 1)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500">Prize Name</label>
                  <input
                    value={tier.name}
                    onChange={(e) => updateTier(index, 'name', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    placeholder="1st Prize"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Amount (£)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.amount}
                    onChange={(e) => updateTier(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500"># Winners</label>
                  <input
                    type="number"
                    min={1}
                    value={tier.winnersCount}
                    onChange={(e) => updateTier(index, 'winnersCount', parseInt(e.target.value) || 1)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    className="text-sm text-red-600 hover:underline"
                    disabled={form.rewards.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="md:col-span-6">
                  <label className="text-xs text-slate-500">Description</label>
                  <input
                    value={tier.description || ''}
                    onChange={(e) => updateTier(index, 'description', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    placeholder="Optional description"
                  />
                </div>
                <div className="md:col-span-6 text-xs text-slate-500">
                  Subtotal: £{((tier.amount || 0) * (tier.winnersCount || 0)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <span className="text-sm font-medium text-primary">
            Total Pool: £{totalPool().toFixed(2)}
          </span>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
            {editingId ? 'Update Configuration' : 'Create Configuration'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="border px-4 py-2 rounded-lg">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="font-semibold mb-4">Existing Reward Configurations</h2>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'numberOfWinners', label: 'Winners' },
          { key: 'totalRewardPool', label: 'Total Pool', render: (r) => `£${Number(r.totalRewardPool).toFixed(2)}` },
          { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
          { key: 'raffle', label: 'Raffle', render: (r) => String((r.raffle as { title?: string })?.title || '-') },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex gap-2">
                <button onClick={() => startEdit(r as unknown as RewardConfig)} className="text-primary text-xs hover:underline">
                  Edit
                </button>
                <button onClick={() => syncPrizes(String(r.id))} className="text-amber-600 text-xs hover:underline">
                  Sync Prizes
                </button>
                <button onClick={() => handleDelete(String(r.id))} className="text-red-600 text-xs hover:underline">
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        data={configs as unknown as Record<string, unknown>[]}
        onExport={() => window.print()}
      />
    </div>
  );
}
