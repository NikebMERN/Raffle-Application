import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_TONE = {
  draft: 'default',
  active: 'success',
  drawing: 'warning',
  completed: 'primary',
  cancelled: 'danger',
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Build the initial editable rows from the round's saved split, or an even split.
function initialRows(raffle) {
  const n = Math.max(1, Number(raffle.winnersCount) || 1);
  const saved = Array.isArray(raffle.prizeDistribution) ? raffle.prizeDistribution : [];
  return Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    percentage: String(saved[i]?.percentage ?? round2(100 / n)),
  }));
}

export default function RaffleDetailAdmin() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/v1/raffles/${id}`);
      setRaffle(data);
      setRows(initialRows(data));
    } catch (err) {
      setError(err.message || 'Could not load raffle');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = useMemo(
    () => round2(rows.reduce((s, r) => s + (Number(r.percentage) || 0), 0)),
    [rows],
  );

  const locked = raffle && (raffle.status === 'completed' || raffle.status === 'cancelled');

  function setPct(index, value) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, percentage: value } : r)));
    setMessage('');
  }

  function distributeEvenly() {
    const n = rows.length;
    const even = round2(100 / n);
    const next = rows.map((r, i) => ({ ...r, percentage: String(even) }));
    // Absorb rounding drift into rank 1 so the total is exactly 100.
    const drift = round2(100 - even * n);
    if (next.length) next[0].percentage = String(round2(even + drift));
    setRows(next);
    setMessage('');
  }

  async function save() {
    setError('');
    setMessage('');
    if (total > 100.01) {
      setError(`Percentages total ${total}%, which exceeds 100%.`);
      return;
    }
    setSaving(true);
    try {
      const prizeDistribution = rows.map((r, i) => ({ rank: i + 1, percentage: round2(Number(r.percentage) || 0) }));
      const { data } = await api.put(`/api/v1/raffles/${id}/prize-distribution`, { prizeDistribution });
      setRaffle(data);
      setRows(initialRows(data));
      setMessage('Prize distribution saved.');
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message || 'Could not save distribution');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (!raffle) return <p className="text-red-600">{error || 'Raffle not found.'}</p>;

  const totalTone = total > 100.01 ? 'text-red-600' : total === 100 ? 'text-emerald-600' : 'text-amber-600';

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link to="/admin/raffles" className="text-sm text-primary hover:underline">← Back to raffles</Link>
          <h1 className="font-display text-2xl font-bold mt-2">
            Round #{raffle.roundNumber} — {raffle.title}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Badge tone={STATUS_TONE[raffle.status] || 'default'}>{raffle.status}</Badge>
            <span>Prize pool {formatCurrency(raffle.prizePool || 0)}</span>
            <span>·</span>
            <span>{raffle.soldCount || 0}/{raffle.totalTickets} sold</span>
            {raffle.endDate && <><span>·</span><span>Ends {formatDate(raffle.endDate)}</span></>}
          </div>
        </div>
      </div>

      {error && <p className="mb-4 text-sm bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
      {message && <p className="mb-4 text-sm bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-3">{message}</p>}

      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">Winner prize distribution</h2>
          {!locked && (
            <Button variant="outline" size="sm" onClick={distributeEvenly}>Distribute evenly</Button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Set the share of the prize pool each winning rank receives for this round. {raffle.winnersCount} winner{raffle.winnersCount === 1 ? '' : 's'}.
        </p>

        {locked && (
          <p className="mb-4 text-sm bg-slate-50 text-slate-500 border border-slate-200 rounded-xl px-4 py-3">
            This round is {raffle.status}; its prize split can no longer be edited.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Rank</th>
                <th className="py-2 pr-4">Percentage (%)</th>
                <th className="py-2 pr-4 text-right">Prize amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.rank} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">#{i + 1}</td>
                  <td className="py-2.5 pr-4">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={locked}
                      className="input max-w-[8rem]"
                      value={r.percentage}
                      onChange={(e) => setPct(i, e.target.value)}
                    />
                  </td>
                  <td className="py-2.5 pr-0 text-right font-medium">
                    {formatCurrency(((raffle.prizePool || 0) * (Number(r.percentage) || 0)) / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="py-3 pr-4 font-semibold">Total</td>
                <td className={`py-3 pr-4 font-semibold ${totalTone}`}>{total}%</td>
                <td className="py-3 pr-0 text-right font-semibold">
                  {formatCurrency(((raffle.prizePool || 0) * Math.min(total, 100)) / 100)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!locked && (
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={save} loading={saving} disabled={total > 100.01}>Save distribution</Button>
            <Button variant="ghost" onClick={() => { setRows(initialRows(raffle)); setError(''); setMessage(''); }}>Reset</Button>
            {total < 100 && <span className="text-xs text-amber-600">Remaining {round2(100 - total)}% stays in the pool.</span>}
          </div>
        )}
      </Card>
    </div>
  );
}
