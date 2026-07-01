import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const TX_META = {
  deposit: { label: 'Deposit', sign: '+', color: 'text-emerald-600' },
  transfer_in: { label: 'Transfer in', sign: '+', color: 'text-emerald-600' },
  refund: { label: 'Refund', sign: '+', color: 'text-emerald-600' },
  withdrawal: { label: 'Withdrawal', sign: '-', color: 'text-red-600' },
  transfer_out: { label: 'Transfer out', sign: '-', color: 'text-red-600' },
  purchase: { label: 'Ticket purchase', sign: '-', color: 'text-red-600' },
};

const TABS = [
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'transfer', label: 'Transfer' },
];

export default function Wallet() {
  const { refreshProfile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const [bal, tx] = await Promise.all([
      api.get('/api/v1/users/wallet'),
      api.get('/api/v1/users/wallet/transactions'),
    ]);
    setBalance(bal.data.balance || 0);
    setTxns(tx.data || []);
    setLoading(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deposit = params.get('deposit');
    const sessionId = params.get('session_id');

    if (deposit === 'success') {
      // Confirm the deposit server-side (verifies the paid Stripe session and
      // credits the wallet) so the balance updates without relying on a webhook.
      (async () => {
        try {
          if (sessionId) await api.post('/api/v1/payments/confirm-deposit', { sessionId });
          setMsg('Deposit successful — funds added to your wallet.');
        } catch (e) {
          setErr(e.message || 'Could not confirm deposit.');
        } finally {
          window.history.replaceState({}, '', '/wallet');
          await load();
          refreshProfile?.();
        }
      })();
      return;
    }

    if (deposit === 'cancelled') {
      setErr('Deposit was cancelled.');
      window.history.replaceState({}, '', '/wallet');
    }
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setErr('');
    const value = Number(amount);
    if (!value || value <= 0) { setErr('Enter a valid amount.'); return; }
    setBusy(true);
    try {
      if (tab === 'deposit') {
        const res = await api.post('/api/v1/payments/wallet-deposit', { amount: value });
        if (res.data.url) { window.location.href = res.data.url; return; }
        setMsg(res.data.message || `Deposited ${formatCurrency(value)}.`);
      } else if (tab === 'withdraw') {
        const res = await api.post('/api/v1/users/wallet/withdraw', { amount: value });
        setMsg(res.data.message || 'Withdrawal requested.');
      } else {
        if (!toEmail.trim()) { setErr('Enter the recipient email.'); setBusy(false); return; }
        const res = await api.post('/api/v1/users/wallet/transfer', { toEmail: toEmail.trim(), amount: value });
        setMsg(res.data.message || 'Transfer complete.');
        setToEmail('');
      }
      setAmount('');
      await load();
      refreshProfile?.();
    } catch (e2) {
      setErr(e2.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  const actionLabel = { deposit: 'Deposit', withdraw: 'Request withdrawal', transfer: 'Send transfer' }[tab];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Wallet</h1>
      <p className="text-slate-500 mt-1 mb-8">Securely deposit, withdraw, transfer and pay. Every transaction is cryptographically signed.</p>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 mb-8">
        {/* Balance */}
        <div className="rounded-2xl p-8 bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-wide text-blue-100">Available balance</span>
            <span className="text-xs bg-white/15 px-2 py-1 rounded-full">USD</span>
          </div>
          <p className="text-5xl font-bold mt-4">{formatCurrency(balance)}</p>
          <p className="text-xs text-blue-100 mt-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Protected by tamper-evident HMAC ledger
          </p>
        </div>

        {/* Actions */}
        <Card>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setMsg(''); setErr(''); }}
                className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
                  tab === t.id ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {msg && <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{msg}</p>}
          {err && <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}

          <form onSubmit={submit} className="space-y-3">
            {tab === 'transfer' && (
              <label className="block text-sm">
                Recipient email
                <input
                  type="email"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="member@example.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                />
              </label>
            )}
            <label className="block text-sm">
              Amount (USD)
              <input
                type="number"
                min="1"
                step="0.01"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Processing…' : actionLabel}
            </Button>
          </form>
          {tab === 'deposit' && (
            <p className="text-xs text-slate-400 mt-3">Funds are added securely via card (Stripe). Use your wallet to buy tickets.</p>
          )}
          {tab === 'withdraw' && (
            <p className="text-xs text-slate-400 mt-3">Withdrawals are held and paid out after admin approval.</p>
          )}
        </Card>
      </div>

      {/* History */}
      <Card>
        <h2 className="font-semibold mb-4">Transaction history</h2>
        {txns.length ? (
          <div className="divide-y">
            {txns.map((t) => {
              const meta = TX_META[t.type] || { label: t.type, sign: '', color: 'text-slate-600' };
              return (
                <div key={t._id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {meta.label}
                      {t.status === 'pending' && <span className="text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">pending</span>}
                      {t.verified
                        ? <span title="Signature verified" className="text-emerald-500">✓</span>
                        : <span title="Signature INVALID" className="text-red-500">⚠</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{t.reference || '—'} · {t.createdAt ? formatDate(t.createdAt) : ''}</p>
                  </div>
                  <span className={`font-semibold ${meta.color} whitespace-nowrap`}>
                    {meta.sign}{formatCurrency(t.amount || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-10">No transactions yet. Make your first deposit above.</p>
        )}
      </Card>
    </div>
  );
}
