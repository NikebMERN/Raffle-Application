import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { formatDate } from '../utils/formatters';

const STATUS_STYLES = {
  sold: 'bg-emerald-100 text-emerald-700',
  reserved: 'bg-amber-100 text-amber-700',
  available: 'bg-slate-100 text-slate-600',
};

export default function MyTickets() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get('/api/v1/tickets/my', { params: { limit: 100 } });
      const tickets = res.data.data || [];

      const ids = [...new Set(tickets.map((t) => t.raffleId))];
      const raffleEntries = await Promise.all(
        ids.map((id) =>
          api
            .get(`/api/v1/raffles/public/${id}`)
            .then((r) => [id, r.data])
            .catch(() => [id, null]),
        ),
      );
      const raffleMap = Object.fromEntries(raffleEntries);

      const grouped = ids.map((id) => ({
        raffle: raffleMap[id],
        raffleId: id,
        tickets: tickets
          .filter((t) => t.raffleId === id)
          .sort((a, b) => (a.ticketNumber || 0) - (b.ticketNumber || 0)),
      }));
      setGroups(grouped);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const totalTickets = groups.reduce((sum, g) => sum + g.tickets.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">My Tickets</h1>
      <p className="text-slate-500 mt-1 mb-8">
        You hold <span className="font-semibold text-slate-700">{totalTickets}</span> ticket{totalTickets === 1 ? '' : 's'} across {groups.length} raffle{groups.length === 1 ? '' : 's'}.
      </p>

      {groups.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 mb-4">You haven&apos;t entered any raffles yet.</p>
          <Link to="/raffles" className="text-primary font-medium hover:underline">Browse active raffles →</Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g.raffleId}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    {g.raffle?.title || `Raffle ${g.raffleId.slice(0, 6)}`}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {g.raffle?.roundNumber ? `Round #${g.raffle.roundNumber}` : ''}
                    {g.raffle?.drawDate ? ` · Draws ${formatDate(g.raffle.drawDate)}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{g.tickets.length}</span>
                  <p className="text-xs text-slate-400">tickets</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.tickets.map((t) => (
                  <span
                    key={t._id || t.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono ${STATUS_STYLES[t.status] || STATUS_STYLES.available}`}
                  >
                    #{String(t.ticketNumber).padStart(3, '0')}
                  </span>
                ))}
              </div>
              {g.raffle?.id && (
                <Link to={`/raffles/${g.raffle.id}`} className="inline-block mt-4 text-sm text-primary hover:underline">
                  View raffle →
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
