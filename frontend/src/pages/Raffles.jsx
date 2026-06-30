import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RaffleCard from '../components/raffle/RaffleCard';

export default function Raffles() {
  const [raffles, setRaffles] = useState([]);
  useEffect(() => {
    api.get('/api/v1/raffles/public').then((r) => setRaffles(r.data.data || []));
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Active Raffles</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {raffles.map((r) => <Link key={r._id} to={`/raffles/${r._id}`}><RaffleCard raffle={r} /></Link>)}
      </div>
    </div>
  );
}
