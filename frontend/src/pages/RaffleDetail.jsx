import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { TicketSelector } from '../components/raffle/TicketGrid';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { PRIZE_DISTRIBUTION } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

const STATUS_TONE = { active: 'success', drawing: 'warning', completed: 'primary', draft: 'default', cancelled: 'danger' };

export default function RaffleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useConfig();
  const [raffle, setRaffle] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/v1/raffles/public/${id}`).then((r) => setRaffle(r.data)).catch(() => setRaffle(false));
  }, [id]);

  async function buy() {
    if (!user) return navigate('/login');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/v1/tickets/purchase', { raffleId: id, quantity, paymentMethod: 'stripe' });
      if (res.data.url) window.location.href = res.data.url;
      else navigate('/my-tickets?success=true');
    } catch (err) {
      setError(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  }

  if (raffle === null) return <Spinner label="Loading round…" />;
  if (raffle === false) return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">Raffle not found.</div>;

  const sold = raffle.soldCount || 0;
  const progress = Math.min(100, (sold / raffle.totalTickets) * 100);
  const total = quantity * raffle.ticketPrice;
  const isOpen = raffle.status === 'active';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3">
        <Badge tone={STATUS_TONE[raffle.status] || 'default'}>{raffle.status}</Badge>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Round #{raffle.roundNumber}</span>
      </div>
      <h1 className="font-display text-3xl font-bold mt-2">{raffle.title}</h1>
      {raffle.description && <p className="text-slate-600 mt-2 max-w-2xl">{raffle.description}</p>}

      <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <div className="flex justify-between text-sm text-slate-500">
              <span>{formatNumber(sold)} / {formatNumber(raffle.totalTickets)} sold</span>
              <span>min {formatNumber(raffle.requiredSold)} to draw</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">Draws automatically when sold out or after the deadline.</p>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Prize distribution</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {PRIZE_DISTRIBUTION.map((p) => (
                <div key={p.rank} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">#{p.rank}</span>
                  <span className="font-semibold">{p.pct}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Percentages of the prize pool. Pool grows with ticket sales.</p>
          </Card>

          {raffle.winners?.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4">Winners</h2>
              <div className="divide-y divide-slate-100">
                {raffle.winners.map((w) => (
                  <div key={w.rank} className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-600">#{w.rank} · Ticket {w.ticketNumber}</span>
                    <span className="font-semibold text-primary">{formatCurrency(w.prizeAmount, currency)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Purchase panel */}
        <Card className="lg:sticky lg:top-24">
          <p className="text-3xl font-bold font-display text-primary">{formatCurrency(raffle.ticketPrice, currency)}</p>
          <p className="text-sm text-slate-400">per ticket</p>

          <div className="mt-5">
            <TicketSelector quantity={quantity} onChange={setQuantity} max={raffle.maxTicketsPerUser} />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">Estimated total</span>
            <span className="text-lg font-bold">{formatCurrency(total, currency)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Bulk discounts are applied automatically at checkout.</p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <Button onClick={buy} loading={loading} disabled={!isOpen} className="mt-4 w-full" size="lg">
            {!isOpen ? 'Round closed' : user ? 'Buy now' : 'Sign in to buy'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
