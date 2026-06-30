import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { getDrawEligibility } from '../../utils/raffle';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/admin/overview');
      setOverview(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runDraw(raffleId) {
    if (!window.confirm('Execute the draw for the active round? This is irreversible.')) return;
    setDrawing(true);
    setMessage('');
    try {
      const res = await api.post(`/api/v1/admin/draws/${raffleId}`);
      setMessage(`Draw complete — ${res.data.winners?.length || 0} winners selected. A new round was auto-started.`);
      await load();
    } catch (err) {
      setMessage(err.message || 'Draw failed');
    } finally {
      setDrawing(false);
    }
  }

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!overview) return <p className="text-slate-500">Could not load dashboard.</p>;

  const active = overview.activeRaffle;
  const eligibility = getDrawEligibility(active);
  const stats = [
    { label: 'Users', value: overview.totalUsers, tone: 'sky' },
    { label: 'Raffles', value: overview.totalRaffles, tone: 'violet' },
    { label: 'Completed sales', value: overview.totalTransactions, tone: 'amber' },
    { label: 'Revenue', value: formatCurrency(overview.totalRevenue), tone: 'emerald' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of users, sales and the current round.</p>
      </div>

      {message && (
        <p className="mb-4 text-sm bg-primary-50 text-primary-700 border border-primary-100 rounded-xl px-4 py-3">{message}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Active round</h2>
          {active && <Badge tone={eligibility.drawable ? 'success' : 'default'}>{eligibility.drawable ? 'Ready to draw' : 'In progress'}</Badge>}
        </div>
        {active ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold">#{active.roundNumber} — {active.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {active.soldCount || 0} / {active.totalTickets} sold (min {active.requiredSold} to draw) ·
                {' '}prize pool {formatCurrency(active.prizePool || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Draws automatically when sold out or after the deadline. {eligibility.reason}.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/raffles"><Button variant="outline">Manage raffles</Button></Link>
              <Button
                variant="danger"
                loading={drawing}
                disabled={!eligibility.drawable}
                onClick={() => runDraw(active._id)}
                title={eligibility.reason}
              >
                Execute draw
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">No active round. <Link to="/admin/raffles" className="text-primary hover:underline">Create one</Link>.</p>
        )}
      </Card>
    </div>
  );
}
