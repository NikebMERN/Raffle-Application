import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getDrawEligibility } from '../../utils/raffle';

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round(((value || 0) / (max || 1)) * 100));
  return (
    <div className="mt-2">
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{value || 0} / {max} sold ({pct}%)</p>
    </div>
  );
}

export default function DrawsAdmin() {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  async function runDraw(raffle) {
    if (!window.confirm(`Execute the draw for round #${raffle.roundNumber}? This is irreversible.`)) return;
    setBusyId(raffle._id);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/api/v1/admin/draws/${raffle._id}`);
      setMessage(`Round #${raffle.roundNumber} drawn — ${res.data.winners?.length || 0} winners selected. A new round was auto-started.`);
      await load();
    } catch (err) {
      setError(err.message || 'Draw failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Spinner />;

  const active = raffles.filter((r) => r.status === 'active' || r.status === 'drawing');
  const completed = raffles
    .filter((r) => r.status === 'completed')
    .sort((a, b) => (b.roundNumber || 0) - (a.roundNumber || 0));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Raffle Draws</h1>
        <p className="text-slate-500 text-sm mt-1">
          Draws run automatically when a round sells out or its deadline passes. You can also trigger an eligible draw manually here.
        </p>
      </div>

      {message && <p className="mb-4 text-sm bg-green-50 text-green-700 border border-green-100 rounded-lg px-4 py-3">{message}</p>}
      {error && <p className="mb-4 text-sm bg-red-50 text-red-600 border border-red-100 rounded-lg px-4 py-3">{error}</p>}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">Awaiting draw</h2>
      {active.length ? (
        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          {active.map((r) => {
            const eligibility = getDrawEligibility(r);
            return (
              <Card key={r._id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-lg">#{r.roundNumber} — {r.title}</p>
                    <p className="text-sm text-slate-500">Prize pool {formatCurrency(r.prizePool || 0)} · {r.winnersCount} winners</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${eligibility.drawable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {eligibility.drawable ? 'Ready' : 'Waiting'}
                  </span>
                </div>
                <ProgressBar value={r.soldCount} max={r.totalTickets} />
                <p className="text-xs text-slate-400 mt-2">Ends {r.endDate ? formatDate(r.endDate) : '—'}</p>
                <div className="mt-4 pt-4 border-t flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">{eligibility.reason}</span>
                  <Button
                    variant="danger"
                    disabled={busyId === r._id || !eligibility.drawable}
                    title={eligibility.reason}
                    onClick={() => runDraw(r)}
                  >
                    {busyId === r._id ? 'Drawing…' : 'Execute Draw'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mb-10"><p className="text-slate-400 text-center py-6">No active rounds awaiting a draw.</p></Card>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">Past draws</h2>
      {completed.length ? (
        <div className="space-y-6">
          {completed.map((r) => (
            <Card key={r._id}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <p className="font-bold text-lg">#{r.roundNumber} — {r.title}</p>
                  <p className="text-sm text-slate-500">
                    Drawn {r.drawDate ? formatDate(r.drawDate) : '—'} · {(r.winners || []).length} winners · pool {formatCurrency(r.prizePool || 0)}
                  </p>
                </div>
                {r.drawHash && (
                  <span className="text-xs text-slate-400 font-mono" title="Provably-fair participant hash">
                    hash: {String(r.drawHash).slice(0, 12)}…
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">Rank</th>
                      <th className="py-2 pr-4">Ticket</th>
                      <th className="py-2 pr-4">Prize</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.winners || []).map((w) => (
                      <tr key={w.rank} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">#{w.rank}</td>
                        <td className="py-2 pr-4">#{w.ticketNumber}</td>
                        <td className="py-2 pr-4">{formatCurrency(w.prizeAmount || 0)}</td>
                        <td className="py-2 pr-4">
                          {w.claimed
                            ? <span className="text-green-700 text-xs font-medium">claimed</span>
                            : <span className="text-amber-600 text-xs font-medium">unclaimed</span>}
                        </td>
                      </tr>
                    ))}
                    {!(r.winners || []).length && (
                      <tr><td colSpan="4" className="py-4 text-center text-slate-400">No winners recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><p className="text-slate-400 text-center py-6">No completed draws yet.</p></Card>
      )}
    </div>
  );
}
