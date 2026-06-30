import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function TicketGrid({ raffleId, onSelect }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.get(`/api/v1/tickets/grid/${raffleId}`).then((r) => setTickets(r.data));
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
          key={t._id}
          type="button"
          onClick={() => toggle(t._id)}
          className={`p-1 text-xs border rounded ${selected.includes(t._id) ? 'bg-primary text-white' : 'hover:border-primary'}`}
        >
          {t.ticketNumber}
        </button>
      ))}
    </div>
  );
}

export function TicketSelector({ quantity, onChange, max = 100 }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">Quantity</label>
      <input type="number" min={1} max={max} value={quantity} onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)} className="border rounded-lg px-3 py-2 w-24" />
    </div>
  );
}
