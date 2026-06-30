import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RaffleCard from '../components/raffle/RaffleCard';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function Raffles() {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/v1/raffles/public')
      .then((r) => setRaffles(r.data.data || []))
      .catch(() => setRaffles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold">Active raffles</h1>
        <p className="text-slate-500 mt-1">Pick a round and grab your tickets.</p>
      </header>

      {loading ? (
        <Spinner label="Loading raffles…" />
      ) : raffles.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map((r) => (
            <Link key={r._id} to={`/raffles/${r._id}`} className="group">
              <RaffleCard raffle={r} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white">
          <EmptyState
            title="No active raffles right now"
            description="A new round starts automatically after each draw. Check back soon."
          />
        </div>
      )}
    </div>
  );
}
