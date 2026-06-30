import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RaffleCard, { CountdownTimer } from '../components/raffle/RaffleCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function Home() {
  const [raffles, setRaffles] = useState([]);
  const active = raffles[0];

  useEffect(() => {
    api.get('/api/v1/raffles/public').then((r) => setRaffles(r.data.data || []));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">SF Football Club Raffle</h1>
          <p className="text-xl text-blue-100 mb-6">1000 tickets · 10 winners · Fair cryptographically secure draws</p>
          {active && (
            <div className="mb-6">
              <p className="text-lg">Current round ends in: <CountdownTimer endDate={active.endDate} /></p>
              <p className="text-sm text-blue-200 mt-2">{active.soldCount || 0} / {active.requiredSold} tickets needed for draw</p>
            </div>
          )}
          <Link to="/raffles"><Button className="bg-accent text-slate-900 hover:bg-amber-400">Buy Tickets</Button></Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Active Raffles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {raffles.map((r) => (
            <Link key={r._id} to={`/raffles/${r._id}`}><RaffleCard raffle={r} /></Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {['Buy Tickets', '800 Sold Triggers Draw', '10 Winners Selected', 'Prizes Claimed'].map((step, i) => (
              <Card key={step}><div className="text-3xl font-bold text-primary mb-2">{i + 1}</div><p>{step}</p></Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
