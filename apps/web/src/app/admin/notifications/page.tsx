'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>('/notifications/templates').then(setTemplates).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Notification Templates</h1>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'channel', label: 'Channel' },
          { key: 'subject', label: 'Subject' },
        ]}
        data={templates}
      />
    </div>
  );
}
