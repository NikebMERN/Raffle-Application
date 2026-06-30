import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatters';

export default function AuditLogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/admin/audit-logs', { params: { page, limit: 25 } });
      setLogs(data.data || []);
      setMeta(data.meta || { page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">A record of administrative and system actions.</p>
      </div>
      <Card>
        {loading ? <Spinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Entity</th>
                    <th className="py-2 pr-4">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l._id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap text-slate-500">{l.createdAt ? formatDate(l.createdAt) : '—'}</td>
                      <td className="py-2 pr-4 font-medium">{l.action}</td>
                      <td className="py-2 pr-4">{l.entity || '—'}{l.entityId ? ` (${String(l.entityId).slice(0, 8)})` : ''}</td>
                      <td className="py-2 pr-4 text-slate-500">{l.userId ? String(l.userId).slice(0, 12) : 'system'}</td>
                    </tr>
                  ))}
                  {!logs.length && (
                    <tr><td colSpan="4" className="py-6 text-center text-slate-400">No audit logs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <Button variant="outline" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Previous</Button>
                <span className="text-slate-500">Page {meta.page} of {meta.totalPages}</span>
                <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => load(meta.page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
