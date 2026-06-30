import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

export function CountdownTimer({ endDate }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate) - Date.now();
      if (diff <= 0) return setTime('Ended');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTime(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [endDate]);

  return <span className="font-mono text-accent font-bold">{time}</span>;
}

export default function RaffleCard({ raffle }) {
  const progress = ((raffle.soldCount || 0) / raffle.totalTickets) * 100;
  return (
    <Card>
      <h3 className="font-semibold text-lg">{raffle.title}</h3>
      <p className="text-sm text-slate-500 mt-1">Round #{raffle.roundNumber}</p>
      <div className="mt-4 flex justify-between">
        <span className="font-bold text-primary">{formatCurrency(raffle.ticketPrice)}</span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{raffle.status}</span>
      </div>
      <div className="mt-3 bg-slate-100 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{raffle.soldCount || 0} / {raffle.totalTickets} sold</p>
    </Card>
  );
}
