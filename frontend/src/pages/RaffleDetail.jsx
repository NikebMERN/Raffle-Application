import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { TicketSelector } from '../components/raffle/TicketGrid';
import { formatCurrency } from '../utils/formatters';
import { PRIZE_DISTRIBUTION } from '../utils/constants';

export default function RaffleDetail() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/raffles/public/${id}`).then((r) => setRaffle(r.data));
  }, [id]);

  async function buy() {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/tickets/purchase', { raffleId: id, quantity, paymentMethod: 'stripe' });
      if (res.data.url) window.location.href = res.data.url;
      else alert('Purchase successful!');
    } catch (err) {
      alert(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  }

  if (!raffle) return <div className="p-8">Loading...</div>;
  const total = quantity * raffle.ticketPrice;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">{raffle.title}</h1>
      <p className="text-slate-600 mt-2">{raffle.description}</p>

      <Card className="mt-8">
        <p className="text-2xl font-bold text-primary">{formatCurrency(raffle.ticketPrice)} per ticket</p>
        <p className="text-sm text-slate-500 mt-2">{raffle.soldCount}/{raffle.requiredSold} sold (need {raffle.requiredSold} for draw)</p>
        <TicketSelector quantity={quantity} onChange={setQuantity} max={raffle.maxTicketsPerUser} />
        <p className="mt-4 font-semibold">Total: {formatCurrency(total)}</p>
        <Button onClick={buy} disabled={loading} className="mt-4">{loading ? 'Processing...' : 'Buy Now'}</Button>
      </Card>

      <Card className="mt-8">
        <h2 className="font-semibold mb-4">Prize Distribution (10 Winners)</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {PRIZE_DISTRIBUTION.map((p) => (
            <div key={p.rank}>#{p.rank}: {p.pct}% of pool</div>
          ))}
        </div>
      </Card>

      {raffle.winners?.length > 0 && (
        <Card className="mt-8">
          <h2 className="font-semibold mb-4">Winners</h2>
          {raffle.winners.map((w) => (
            <div key={w.rank} className="flex justify-between py-2 border-b">
              <span>#{w.rank} - Ticket {w.ticketNumber}</span>
              <span>{formatCurrency(w.prizeAmount)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
