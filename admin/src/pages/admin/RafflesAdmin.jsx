import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getDrawEligibility } from '../../utils/raffle';
import { useConfig } from '../../context/ConfigContext';

const STATUS_TONE = {
  draft: 'default',
  active: 'success',
  drawing: 'warning',
  completed: 'primary',
  cancelled: 'danger',
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Turn a saved reward config's tiers into a per-rank percentage split of its pool.
function deriveDistribution(reward) {
  if (!reward) return [];
  const pool = Number(reward.totalRewardPool || 0);
  const tiers = [...(reward.rewards || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const amounts = [];
  tiers.forEach((t) => {
    const w = Math.max(1, Number(t.winnersCount) || 1);
    for (let i = 0; i < w; i += 1) amounts.push(Number(t.amount) || 0);
  });
  if (!amounts.length || pool <= 0) return [];
  const dist = amounts.map((amt, i) => ({ rank: i + 1, percentage: round2((amt / pool) * 100) }));
  // Absorb rounding drift into rank 1 so the split totals 100%.
  const drift = round2(100 - dist.reduce((s, d) => s + d.percentage, 0));
  dist[0].percentage = round2(dist[0].percentage + drift);
  return dist;
}

// Build the create-form defaults from the live (Firestore-backed) config so a new
// round inherits whatever the admin has configured under Settings.
const formFromConfig = (config) => {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    totalTickets: config.totalTickets ?? 1000,
    ticketPrice: config.ticketPrice ?? 5,
    requiredSold: config.requiredSold ?? 800,
    winnersCount: config.winnersCount ?? 10,
    maxTicketsPerUser: config.maxTicketsPerUser ?? 100,
    prizePool: '',
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

export default function RafflesAdmin() {
  const config = useConfig();
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(() => formFromConfig(config));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rewardConfigs, setRewardConfigs] = useState([]);
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [appliedDistribution, setAppliedDistribution] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/raffles', { params: { limit: 100 } });
      setRaffles(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get('/api/v1/admin/rewards', { params: { limit: 100 } })
      .then(({ data }) => setRewardConfigs(data.data || []))
      .catch(() => setRewardConfigs([]));
  }, []);

  const selectedReward = useMemo(
    () => rewardConfigs.find((r) => r._id === selectedRewardId) || null,
    [rewardConfigs, selectedRewardId],
  );

  // Tickets that must sell — at the current ticket price — to fund the config's pool.
  const ticketsToReachPool = useMemo(() => {
    if (!selectedReward) return null;
    const price = Number(form.ticketPrice);
    const pool = Number(selectedReward.totalRewardPool || 0);
    if (!price || price <= 0) return null;
    return Math.ceil(pool / price);
  }, [selectedReward, form.ticketPrice]);

  const derivedDistribution = useMemo(() => deriveDistribution(selectedReward), [selectedReward]);

  function applyReward() {
    if (!selectedReward || !ticketsToReachPool) return;
    const pool = Number(selectedReward.totalRewardPool || 0);
    const dist = derivedDistribution;
    const winners = dist.length || Math.min(Number(selectedReward.numberOfWinners) || 1, ticketsToReachPool);
    setForm((f) => {
      const totalTickets = Math.max(Number(f.totalTickets) || 0, ticketsToReachPool);
      const requiredSold = ticketsToReachPool;
      const winnersCount = Math.min(winners, requiredSold);
      return { ...f, prizePool: String(pool), totalTickets, requiredSold, winnersCount };
    });
    setAppliedDistribution(dist.length ? dist : null);
    setError('');
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    // Editing the winner count invalidates a previously applied reward split.
    if (field === 'winnersCount') setAppliedDistribution(null);
  }

  // Refresh blank-form defaults once the live config arrives (title/description untouched).
  useEffect(() => {
    setForm((f) => (f.title || f.description ? f : formFromConfig(config)));
  }, [config.totalTickets, config.ticketPrice, config.requiredSold, config.winnersCount, config.maxTicketsPerUser]);

  async function create(e) {
    e.preventDefault();
    setError('');

    const totalTickets = Number(form.totalTickets);
    const ticketPrice = Number(form.ticketPrice);
    const requiredSold = Number(form.requiredSold);
    const winnersCount = Number(form.winnersCount);
    const maxTicketsPerUser = Number(form.maxTicketsPerUser);

    // Mirror the backend rules so we never round-trip an invalid config.
    if (requiredSold > totalTickets) {
      setError('Required sold cannot exceed total tickets.');
      return;
    }
    if (winnersCount > requiredSold) {
      setError('Winners cannot exceed required sold. Lower the winners count or raise required sold.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/api/v1/raffles', {
        ...form,
        totalTickets,
        ticketPrice,
        requiredSold,
        winnersCount,
        maxTicketsPerUser,
        prizePool: form.prizePool ? Number(form.prizePool) : undefined,
        // Only send the applied reward split if it still matches the winner count.
        prizeDistribution:
          appliedDistribution && appliedDistribution.length === winnersCount ? appliedDistribution : undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      setForm(formFromConfig(config));
      setSelectedRewardId('');
      setAppliedDistribution(null);
      await load();
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message || 'Could not create raffle');
    } finally {
      setCreating(false);
    }
  }

  async function action(id, verb) {
    setBusyId(id);
    setError('');
    try {
      if (verb === 'draw') await api.post(`/api/v1/admin/draws/${id}`);
      else await api.post(`/api/v1/raffles/${id}/${verb}`);
      await load();
    } catch (err) {
      setError(err.message || `Could not ${verb}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Raffles</h1>
        <p className="text-slate-500 text-sm mt-1">Create rounds and manage their lifecycle. Defaults come from Settings.</p>
      </div>
      {error && <p className="mb-4 text-sm bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">Create a new round</h2>

        {rewardConfigs.length > 0 && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="text-sm font-medium text-slate-700 block">
              Fund from a saved reward config (optional)
              <select
                className="input mt-1.5"
                value={selectedRewardId}
                onChange={(e) => setSelectedRewardId(e.target.value)}
              >
                <option value="">— None —</option>
                {rewardConfigs.map((rc) => (
                  <option key={rc._id} value={rc._id}>
                    {rc.name} · {formatCurrency(rc.totalRewardPool || 0)} · {rc.numberOfWinners} winners
                  </option>
                ))}
              </select>
            </label>

            {selectedReward && (
              <div className="mt-3 text-sm text-slate-600 space-y-1">
                <p>Target pool: <strong>{formatCurrency(selectedReward.totalRewardPool || 0)}</strong> · {selectedReward.numberOfWinners} winners</p>
                {ticketsToReachPool != null ? (
                  <p>
                    At {formatCurrency(Number(form.ticketPrice) || 0)} per ticket,{' '}
                    <strong className="text-primary">{ticketsToReachPool.toLocaleString()}</strong> tickets must be sold to reach the pool.
                  </p>
                ) : (
                  <p className="text-amber-600">Set a ticket price above 0 to calculate required tickets.</p>
                )}

                {derivedDistribution.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-slate-500 mb-1">Reward distribution ({derivedDistribution.length} winners):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {derivedDistribution.map((d) => (
                        <span key={d.rank} className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs">
                          <span className="text-slate-400">#{d.rank}</span>
                          <span className="font-semibold">{d.percentage}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ticketsToReachPool != null && (
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={applyReward}>
                    Apply to form
                  </Button>
                )}
                {form.prizePool && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Applied: pool {formatCurrency(Number(form.prizePool))}, required sold {Number(form.requiredSold).toLocaleString()}, {form.winnersCount} winners
                    {appliedDistribution ? ', with the reward split above' : ''}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Title
            <input className="input mt-1.5" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">
            Description
            <input className="input mt-1.5" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <label className="text-sm font-medium text-slate-700">Total tickets
            <input type="number" min="1" className="input mt-1.5" value={form.totalTickets} onChange={(e) => set('totalTickets', e.target.value)} />
          </label>
          <label className="text-sm font-medium text-slate-700">Ticket price ($)
            <input type="number" min="0" step="0.01" className="input mt-1.5" value={form.ticketPrice} onChange={(e) => set('ticketPrice', e.target.value)} />
          </label>
          <label className="text-sm font-medium text-slate-700">Required sold
            <input type="number" min="1" max={form.totalTickets || undefined} className="input mt-1.5" value={form.requiredSold} onChange={(e) => set('requiredSold', e.target.value)} />
            <span className="block text-xs font-normal text-slate-400 mt-1">Minimum tickets sold for the draw to be valid (≤ total tickets).</span>
          </label>
          <label className="text-sm font-medium text-slate-700">Winners
            <input type="number" min="1" max={form.requiredSold || undefined} className="input mt-1.5" value={form.winnersCount} onChange={(e) => set('winnersCount', e.target.value)} />
            <span className="block text-xs font-normal text-slate-400 mt-1">Number of prizes drawn (≤ required sold).</span>
          </label>
          <label className="text-sm font-medium text-slate-700">Max tickets / user
            <input type="number" min="1" className="input mt-1.5" value={form.maxTicketsPerUser} onChange={(e) => set('maxTicketsPerUser', e.target.value)} />
          </label>
          <div />
          <label className="text-sm font-medium text-slate-700">Start date
            <input type="date" className="input mt-1.5" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </label>
          <label className="text-sm font-medium text-slate-700">End date
            <input type="date" className="input mt-1.5" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={creating}>Create raffle</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">All rounds</h2>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Sold</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Ends</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {raffles.map((r) => (
                  <tr key={r._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium">{r.roundNumber}</td>
                    <td className="py-3 pr-4">{r.title}</td>
                    <td className="py-3 pr-4"><Badge tone={STATUS_TONE[r.status] || 'default'}>{r.status}</Badge></td>
                    <td className="py-3 pr-4">{r.soldCount || 0}/{r.totalTickets}</td>
                    <td className="py-3 pr-4">{formatCurrency(r.ticketPrice)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{r.endDate ? formatDate(r.endDate) : '—'}</td>
                    <td className="py-3 pr-0">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Link to={`/admin/raffles/${r._id}`}>
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                        {r.status === 'draft' && (
                          <Button variant="outline" size="sm" disabled={busyId === r._id} onClick={() => action(r._id, 'publish')}>Publish</Button>
                        )}
                        {r.status === 'active' && (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={busyId === r._id || !getDrawEligibility(r).drawable}
                              title={getDrawEligibility(r).reason}
                              onClick={() => action(r._id, 'draw')}
                            >
                              Draw
                            </Button>
                            <Button variant="secondary" size="sm" disabled={busyId === r._id} onClick={() => action(r._id, 'cancel')}>Cancel</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!raffles.length && (
                  <tr><td colSpan="7"><EmptyState title="No raffles yet" description="Create your first round above." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
