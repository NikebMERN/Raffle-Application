import { useState, useEffect } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useConfig } from '../../context/ConfigContext';

export function CountdownTimer({ endDate }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate) - Date.now();
      if (diff <= 0) return setTime('Ended');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return setTime(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [endDate]);

  return <span className="font-mono text-accent font-bold">{time}</span>;
}

const STATUS_TONE = {
  active: 'success',
  drawing: 'warning',
  completed: 'primary',
  draft: 'default',
  cancelled: 'danger',
};

export default function RaffleCard({ raffle }) {
  const { currency } = useConfig();
  const sold = raffle.soldCount || 0;
  const progress = Math.min(100, (sold / raffle.totalTickets) * 100);
  const remaining = Math.max(0, raffle.totalTickets - sold);

  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Round #{raffle.roundNumber}</p>
          <h3 className="font-semibold text-lg leading-snug mt-0.5">{raffle.title}</h3>
        </div>
        <Badge tone={STATUS_TONE[raffle.status] || 'default'}>{raffle.status}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-2xl font-bold font-display text-primary">{formatCurrency(raffle.ticketPrice, currency)}</span>
        <span className="text-xs text-slate-400">per ticket</span>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-400">
          <span>{formatNumber(sold)} / {formatNumber(raffle.totalTickets)} sold</span>
          <span>{formatNumber(remaining)} left</span>
        </div>
      </div>

      <div className="mt-auto pt-4 text-sm font-medium text-primary group-hover:underline">View round →</div>
    </Card>
  );
}
