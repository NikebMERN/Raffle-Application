interface DataTableProps<T extends Record<string, unknown>> {
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  data: T[];
  onExport?: () => void;
  onPrint?: () => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onExport,
  onPrint,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex gap-2 p-4 border-b border-slate-100">
        {onExport && (
          <button onClick={onExport} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-slate-50">
            Export CSV
          </button>
        )}
        {onPrint && (
          <button onClick={onPrint} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-slate-50">
            Print
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 font-medium text-slate-600">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
