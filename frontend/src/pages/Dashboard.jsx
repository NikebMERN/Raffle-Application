import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

const TX_SIGN = {
  deposit: '+', transfer_in: '+', refund: '+',
  withdrawal: '-', transfer_out: '-', purchase: '-',
};

function StatCard({ label, value, accent, to, cta }) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {to && <Link to={to} className="text-sm text-primary hover:underline mt-2 inline-block">{cta} →</Link>}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [wallet, tickets, raffles, txns] = await Promise.all([
        api.get('/api/v1/users/wallet'),
        api.get('/api/v1/tickets/my', { params: { limit: 100 } }),
        api.get('/api/v1/raffles/public'),
        api.get('/api/v1/users/wallet/transactions', { params: { limit: 5 } }),
      ]);
      setData({
        balance: wallet.data.balance || 0,
        ticketCount: (tickets.data.data || []).length,
        activeRaffles: (raffles.data.data || []).length,
        recent: txns.data || [],
      });
    })();
  }, []);

  if (!data) return <Spinner />;

  const name = user?.displayName || user?.firstName || 'there';

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Welcome back, {name.split(' ')[0]} 👋</h1>
      <p className="text-slate-500 mt-1 mb-8">Here&apos;s a snapshot of your account.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Wallet balance" value={formatCurrency(data.balance)} accent="border-primary" to="/wallet" cta="Manage wallet" />
        <StatCard label="Your tickets" value={data.ticketCount} accent="border-emerald-500" to="/my-tickets" cta="View tickets" />
        <StatCard label="Active raffles" value={data.activeRaffles} accent="border-amber-500" to="/raffles" cta="Browse raffles" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/wallet" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {data.recent.length ? (
            <div className="divide-y">
              {data.recent.map((t) => {
                const sign = TX_SIGN[t.type] || '';
                const positive = sign === '+';
                return (
                  <div key={t._id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.reference || t.type}</p>
                      <p className="text-xs text-slate-400">{t.createdAt ? formatDate(t.createdAt) : ''}</p>
                    </div>
                    <span className={`font-semibold whitespace-nowrap ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sign}{formatCurrency(t.amount || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No activity yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/raffles" className="rounded-xl border border-slate-200 p-4 hover:border-primary hover:bg-blue-50/50 transition-colors">
              <p className="font-medium">Enter a raffle</p>
              <p className="text-xs text-slate-400 mt-1">Browse open draws</p>
            </Link>
            <Link to="/wallet" className="rounded-xl border border-slate-200 p-4 hover:border-primary hover:bg-blue-50/50 transition-colors">
              <p className="font-medium">Add funds</p>
              <p className="text-xs text-slate-400 mt-1">Top up your wallet</p>
            </Link>
            <Link to="/wallet" className="rounded-xl border border-slate-200 p-4 hover:border-primary hover:bg-blue-50/50 transition-colors">
              <p className="font-medium">Send money</p>
              <p className="text-xs text-slate-400 mt-1">Transfer to a member</p>
            </Link>
            <Link to="/my-tickets" className="rounded-xl border border-slate-200 p-4 hover:border-primary hover:bg-blue-50/50 transition-colors">
              <p className="font-medium">My tickets</p>
              <p className="text-xs text-slate-400 mt-1">Track your entries</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
