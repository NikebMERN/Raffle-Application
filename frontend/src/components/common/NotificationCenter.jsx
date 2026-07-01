import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';

const CATEGORY_ICON = {
  wins: '🏆',
  purchases: '🎟️',
  system: '🔔',
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [claimMsg, setClaimMsg] = useState('');
  const ref = useRef(null);

  const unread = items.filter((n) => !n.read).length;

  async function load() {
    try {
      const { data } = await api.get('/api/v1/users/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore transient errors
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  async function markRead(id) {
    setItems((arr) => arr.map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n)));
    try { await api.post(`/api/v1/users/notifications/${id}/read`); } catch { /* noop */ }
  }

  async function markAllRead() {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    try { await api.post('/api/v1/users/notifications/read-all'); } catch { /* noop */ }
  }

  async function claim(raffleId, id) {
    setClaiming(raffleId);
    setClaimMsg('');
    try {
      const { data } = await api.post(`/api/v1/users/claim-prize/${raffleId}`);
      setClaimMsg(data.message || 'Prize claimed!');
      setItems((arr) => arr.map((n) => ((n._id || n.id) === id
        ? { ...n, read: true, metadata: { ...n.metadata, claimed: true } }
        : n)));
    } catch (err) {
      setClaimMsg(err.message || 'Could not claim prize');
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
            )}
          </div>

          {claimMsg && (
            <p className="px-4 py-2 text-xs text-emerald-700 bg-emerald-50 border-b border-emerald-100">{claimMsg}</p>
          )}

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            )}
            {items.map((n) => {
              const id = n._id || n.id;
              const isWin = n.category === 'wins' && n.metadata?.raffleId;
              const claimed = n.metadata?.claimed;
              return (
                <div key={id} className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-blue-50/40'}`}>
                  <div className="flex gap-2">
                    <span className="text-lg leading-none">{CATEGORY_ICON[n.category] || '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        {!n.read && (
                          <button onClick={() => markRead(id)} className="shrink-0 text-[11px] text-slate-400 hover:text-primary">Mark read</button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{formatDate(n.sentAt || n.createdAt)}</p>

                      {isWin && (
                        claimed ? (
                          <span className="mt-2 inline-block text-xs font-medium text-emerald-600">✓ Prize claimed</span>
                        ) : (
                          <button
                            onClick={() => claim(n.metadata.raffleId, id)}
                            disabled={claiming === n.metadata.raffleId}
                            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
                          >
                            {claiming === n.metadata.raffleId
                              ? 'Claiming…'
                              : `Claim ${n.metadata.prizeAmount ? formatCurrency(n.metadata.prizeAmount) : 'prize'}`}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
