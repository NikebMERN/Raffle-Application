'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>[]>([]);
  const [backups, setBackups] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>('/settings').then(setSettings).catch(() => {});
    api<Record<string, unknown>[]>('/backups').then(setBackups).catch(() => {});
  }, []);

  async function createBackup() {
    await api('/backups', { method: 'POST' });
    api<Record<string, unknown>[]>('/backups').then(setBackups);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <DataTable
        columns={[
          { key: 'key', label: 'Key' },
          { key: 'value', label: 'Value' },
          { key: 'description', label: 'Description' },
        ]}
        data={settings}
      />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Backups</h2>
          <button onClick={createBackup} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">
            Create Backup
          </button>
        </div>
        <DataTable
          columns={[
            { key: 'filename', label: 'Filename' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Date', render: (r) => new Date(String(r.createdAt)).toLocaleString() },
          ]}
          data={backups}
        />
      </div>
    </div>
  );
}
