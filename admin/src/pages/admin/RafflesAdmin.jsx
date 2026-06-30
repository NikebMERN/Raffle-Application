import { useEffect, useState } from 'react';
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
  }, []);

  // Refresh blank-form defaults once the live config arrives (title/description untouched).
  useEffect(() => {
    setForm((f) => (f.title || f.description ? f : formFromConfig(config)));
  }, [config.totalTickets, config.ticketPrice, config.requiredSold, config.winnersCount, config.maxTicketsPerUser]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function create(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/api/v1/raffles', {
        ...form,
        totalTickets: Number(form.totalTickets),
        ticketPrice: Number(form.ticketPrice),
        requiredSold: Number(form.requiredSold),
        winnersCount: Number(form.winnersCount),
        maxTicketsPerUser: Number(form.maxTicketsPerUser),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      setForm(formFromConfig(config));
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
            <input type="number" min="1" className="input mt-1.5" value={form.requiredSold} onChange={(e) => set('requiredSold', e.target.value)} />
          </label>
          <label className="text-sm font-medium text-slate-700">Winners
            <input type="number" min="1" className="input mt-1.5" value={form.winnersCount} onChange={(e) => set('winnersCount', e.target.value)} />
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
