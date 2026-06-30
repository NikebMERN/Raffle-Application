import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function TicketGrid({ raffleId, onSelect }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.get(`/api/v1/tickets/grid/${raffleId}`).then((r) => setTickets(r.data)).catch(() => setTickets([]));
  }, [raffleId]);

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    onSelect?.(next);
  };

  return (
    <div className="grid grid-cols-10 gap-1">
      {tickets.filter((t) => t.status === 'available').slice(0, 100).map((t) => (
        <button
          key={t._id || t.id}
          type="button"
          onClick={() => toggle(t._id || t.id)}
          className={`p-1 text-xs rounded-md border transition-colors ${
            selected.includes(t._id || t.id)
              ? 'bg-primary text-white border-primary'
              : 'border-slate-200 hover:border-primary hover:text-primary'
          }`}
        >
          {t.ticketNumber}
        </button>
      ))}
    </div>
  );
}

export function TicketSelector({ quantity, onChange, max = 100 }) {
  const clamp = (n) => Math.max(1, Math.min(max, n));
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">Quantity</label>
      <div className="mt-2 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp((quantity || 1) - 1))}
          className="grid w-11 place-items-center rounded-xl border border-slate-300 text-lg font-semibold text-slate-600 hover:bg-slate-50"
          aria-label="Decrease"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={max}
          value={quantity}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || 1))}
          className="input text-center w-full"
        />
        <button
          type="button"
          onClick={() => onChange(clamp((quantity || 1) + 1))}
          className="grid w-11 place-items-center rounded-xl border border-slate-300 text-lg font-semibold text-slate-600 hover:bg-slate-50"
          aria-label="Increase"
        >
          +
        </button>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">Up to {max} tickets per person.</p>
    </div>
  );
}
