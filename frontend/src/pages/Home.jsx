import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RaffleCard, { CountdownTimer } from '../components/raffle/RaffleCard';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useConfig } from '../context/ConfigContext';
import { formatNumber } from '../utils/formatters';

const STEPS = [
  { title: 'Buy your tickets', body: 'Pick the open round and grab as many tickets as you like.' },
  { title: 'Round closes', body: 'The draw runs once tickets sell out or the deadline is reached.' },
  { title: 'Winners drawn', body: 'A cryptographically secure shuffle picks the winners — fairly.' },
  { title: 'Prizes paid', body: 'Winners are notified instantly and claim their share of the pool.' },
];

export default function Home() {
  const { clubName, totalTickets, winnersCount, requiredSold } = useConfig();
  const [raffles, setRaffles] = useState([]);
  const active = raffles[0];

  useEffect(() => {
    api.get('/api/v1/raffles/public').then((r) => setRaffles(r.data.data || [])).catch(() => setRaffles([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white">
        <div className="absolute inset-0 bg-dot-grid opacity-60" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Community raffle · fair &amp; transparent
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl font-extrabold tracking-tight">{clubName} Raffle</h1>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            {formatNumber(totalTickets)} tickets · {winnersCount} winners · cryptographically secure draws you can verify.
          </p>

          {active && (
            <div className="mt-8 inline-flex flex-col items-center gap-1 rounded-2xl bg-white/10 px-6 py-4 ring-1 ring-white/15 backdrop-blur">
              <p className="text-sm text-blue-100">Current round ends in</p>
              <p className="text-2xl"><CountdownTimer endDate={active.endDate} /></p>
              <p className="text-xs text-blue-200 mt-1">
                {formatNumber(active.soldCount || 0)} / {formatNumber(active.totalTickets)} sold · min {formatNumber(active.requiredSold ?? requiredSold)} to draw
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/raffles"><Button variant="accent" size="lg">Buy tickets</Button></Link>
            <a href="#how"><Button variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20">How it works</Button></a>
          </div>
        </div>
      </section>

      {/* Active raffles */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold">Active raffles</h2>
            <p className="text-slate-500 text-sm mt-1">Open rounds you can enter right now.</p>
          </div>
          <Link to="/raffles" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>

        {raffles.length ? (
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
      </section>

      {/* How it works */}
      <section id="how" className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold">How it works</h2>
            <p className="text-slate-500 mt-2">Four simple steps from ticket to prize — with a verifiable, tamper-evident draw.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 p-6 hover:shadow-card-hover transition">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary font-display font-bold">{i + 1}</div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
