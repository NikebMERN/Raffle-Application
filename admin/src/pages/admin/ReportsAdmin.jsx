import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ReportsAdmin() {
  const [report, setReport] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/admin/reports'),
      api.get('/api/v1/admin/ticket-inventory'),
    ])
      .then(([r, inv]) => {
        setReport(r.data);
        setInventory(inv.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Sales performance and ticket inventory.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card><p className="text-sm text-slate-500">Total sales</p><p className="text-2xl font-bold">{report?.totalSales || 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Revenue</p><p className="text-2xl font-bold">{formatCurrency(report?.totalRevenue || 0)}</p></Card>
        <Card><p className="text-sm text-slate-500">Card (Stripe)</p><p className="text-2xl font-bold">{formatCurrency(report?.online?.revenue || 0)}</p><p className="text-xs text-slate-400">{report?.online?.count || 0} sales</p></Card>
        <Card><p className="text-sm text-slate-500">Wallet</p><p className="text-2xl font-bold">{formatCurrency(report?.wallet?.revenue || 0)}</p><p className="text-xs text-slate-400">{report?.wallet?.count || 0} sales</p></Card>
      </div>

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">Ticket inventory</h2>
        <div className="flex flex-wrap gap-3">
          {inventory.map((row) => (
            <div key={row._id} className="px-4 py-2 rounded-lg bg-slate-50 text-sm">
              <span className="text-slate-500 capitalize">{row._id}: </span>
              <strong>{row.count}</strong>
            </div>
          ))}
          {!inventory.length && <p className="text-slate-400">No tickets yet.</p>}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Recent sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(report?.sales || []).map((s) => (
                <tr key={s._id} className="border-b last:border-0">
                  <td className="py-2 pr-4 whitespace-nowrap">{s.createdAt ? formatDate(s.createdAt) : '—'}</td>
                  <td className="py-2 pr-4 capitalize">{s.paymentMethod}</td>
                  <td className="py-2 pr-4">{formatCurrency(s.amount || 0)}</td>
                  <td className="py-2 pr-4 capitalize">{s.status}</td>
                </tr>
              ))}
              {!(report?.sales || []).length && (
                <tr><td colSpan="4" className="py-6 text-center text-slate-400">No sales yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
