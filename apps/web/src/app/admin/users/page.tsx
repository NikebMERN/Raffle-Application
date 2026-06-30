'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<{ data: Record<string, unknown>[] }>('/users').then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <DataTable
        columns={[
          { key: 'email', label: 'Email' },
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
          {
            key: 'roles',
            label: 'Roles',
            render: (r) =>
              ((r.roles as { role: { code: string } }[]) || []).map((x) => x.role.code).join(', '),
          },
        ]}
        data={users}
        onExport={() => window.print()}
        onPrint={() => window.print()}
      />
    </div>
  );
}
