'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [tab, setTab] = useState<'audit' | 'activity' | 'security'>('audit');

  useEffect(() => {
    const endpoint = tab === 'audit' ? '/audit-logs' : tab === 'activity' ? '/activity-logs' : '/security-logs';
    api<{ data: Record<string, unknown>[] }>(endpoint).then((r) => setLogs(r.data)).catch(() => {});
  }, [tab]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Logs</h1>
      <div className="flex gap-2 mb-6">
        {(['audit', 'activity', 'security'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${tab === t ? 'bg-primary text-white' : 'bg-white border'}`}
          >
            {t} Logs
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'action', label: tab === 'security' ? 'Event' : 'Action', render: (r) => String(r.action || r.event || '') },
          { key: 'entity', label: 'Entity' },
          { key: 'createdAt', label: 'Date', render: (r) => new Date(String(r.createdAt)).toLocaleString() },
        ]}
        data={logs}
        onExport={() => window.print()}
      />
    </div>
  );
}
