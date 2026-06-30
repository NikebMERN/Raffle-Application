'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/utils';

export default function AdminReportsPage() {
  const [sales, setSales] = useState<Record<string, unknown> | null>(null);
  const [sellers, setSellers] = useState<Record<string, unknown>[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>>('/reports/sales').then(setSales).catch(() => {});
    api<Record<string, unknown>[]>('/reports/sellers').then(setSellers).catch(() => {});
    api<Record<string, unknown>[]>('/reports/inventory').then(setInventory).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Reports & Analytics</h1>

      {sales && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Sales" value={Number(sales.totalSales)} />
          <StatCard label="Total Revenue" value={`£${Number(sales.totalRevenue).toFixed(2)}`} />
          <StatCard label="Online" value={Number((sales.online as { count: number })?.count)} />
          <StatCard label="Offline" value={Number((sales.offline as { count: number })?.count)} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-4">Seller Performance</h2>
          <DataTable
            columns={[
              { key: 'seller', label: 'Seller', render: (r) => String((r.seller as { name?: string })?.name || '') },
              { key: 'sold', label: 'Sold' },
              { key: 'revenue', label: 'Revenue', render: (r) => `£${Number(r.revenue).toFixed(2)}` },
            ]}
            data={sellers}
            onExport={() => window.print()}
          />
        </div>
        <div>
          <h2 className="font-semibold mb-4">Ticket Inventory</h2>
          <DataTable
            columns={[
              { key: 'status', label: 'Status' },
              { key: '_count', label: 'Count', render: (r) => String((r._count as number) || '') },
            ]}
            data={inventory}
          />
        </div>
      </div>
    </div>
  );
}
