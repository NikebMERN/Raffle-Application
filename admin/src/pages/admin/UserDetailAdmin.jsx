import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TX_LABEL = {
  wallet_deposit: 'Wallet deposit',
};

function Stat({ label, value, accent }) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Card>
  );
}

export default function UserDetailAdmin() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [txns, setTxns] = useState([]);
  const [stats, setStats] = useState({ tickets: 0, raffles: 0, spent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [uRes, tRes, pRes] = await Promise.all([
          api.get(`/api/v1/users/${id}`),
          api.get('/api/v1/tickets', { params: { userId: id, limit: 500 } }),
          api.get('/api/v1/payments', { params: { userId: id } }).catch(() => ({ data: [] })),
        ]);

        setUser(uRes.data);
        setTxns(Array.isArray(pRes.data) ? pRes.data : []);

        const tickets = tRes.data.data || [];
        const sold = tickets.filter((t) => t.status === 'sold');
        const spent = sold.reduce((s, t) => s + (Number(t.price) || 0), 0);

        const ids = [...new Set(tickets.map((t) => t.raffleId))];
        const raffleEntries = await Promise.all(
          ids.map((rid) =>
            api.get(`/api/v1/raffles/public/${rid}`).then((r) => [rid, r.data]).catch(() => [rid, null])),
        );
        const raffleMap = Object.fromEntries(raffleEntries);

        const grouped = ids
          .map((rid) => ({
            raffleId: rid,
            raffle: raffleMap[rid],
            tickets: tickets.filter((t) => t.raffleId === rid),
          }))
          .sort((a, b) => (b.raffle?.roundNumber || 0) - (a.raffle?.roundNumber || 0));

        setGroups(grouped);
        setStats({ tickets: sold.length, raffles: ids.length, spent });
      } catch (err) {
        setError(err.message || 'Could not load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Spinner />;
  if (!user) return <p className="text-red-600">{error || 'User not found.'}</p>;

  const name = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—';

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link to="/admin/users" className="text-sm text-primary hover:underline">← Back to users</Link>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full" />
            : <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary text-xl font-bold">{name[0]?.toUpperCase() || 'U'}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold">{name}</h1>
              <Badge tone={user.isActive === false ? 'danger' : 'success'}>{user.isActive === false ? 'banned' : 'active'}</Badge>
              <Badge tone="primary">{user.role}</Badge>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
            <div className="mt-3 grid sm:grid-cols-3 gap-2 text-sm text-slate-500">
              <span>Joined: {user.createdAt ? formatDate(user.createdAt) : '—'}</span>
              <span>Last login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</span>
              <span>Provider: {user.provider || '—'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Wallet balance" value={formatCurrency(user.walletBalance || 0)} accent="border-primary" />
        <Stat label="Tickets purchased" value={stats.tickets} accent="border-emerald-500" />
        <Stat label="Raffles entered" value={stats.raffles} accent="border-amber-500" />
        <Stat label="Total spent" value={formatCurrency(stats.spent)} accent="border-slate-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Raffles participated */}
        <Card>
          <h2 className="font-semibold mb-4">Raffles participated ({groups.length})</h2>
          {groups.length ? (
            <div className="divide-y divide-slate-100">
              {groups.map((g) => (
                <div key={g.raffleId} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link to={`/admin/raffles/${g.raffleId}`} className="font-medium text-sm hover:text-primary truncate block">
                      {g.raffle?.title || `Raffle ${g.raffleId.slice(0, 6)}`}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {g.raffle?.roundNumber ? `Round #${g.raffle.roundNumber}` : ''}{g.raffle?.status ? ` · ${g.raffle.status}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">{g.tickets.length} ticket{g.tickets.length === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-400 text-center py-8 text-sm">No raffle participation yet.</p>}
        </Card>

        {/* Transactions */}
        <Card>
          <h2 className="font-semibold mb-4">Payment history ({txns.length})</h2>
          {txns.length ? (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {txns.map((t) => (
                <div key={t._id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{TX_LABEL[t.kind] || 'Ticket purchase'}</p>
                    <p className="text-xs text-slate-400">
                      {t.paymentMethod || '—'} · {t.status} · {t.createdAt ? formatDate(t.createdAt) : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">{formatCurrency(t.amount || 0)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-400 text-center py-8 text-sm">No transactions yet.</p>}
        </Card>
      </div>

      {/* Placeholder for future admin tools (e.g. wallet transfer/adjustments) */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-1">Wallet &amp; transfers</h2>
        <p className="text-sm text-slate-500">
          Current balance <strong>{formatCurrency(user.walletBalance || 0)}</strong>. Transfer and balance-adjustment tools will appear here.
        </p>
      </Card>
    </div>
  );
}
