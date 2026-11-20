import { formatRupiah, monthLabel } from '@/lib/format';

export function TrendChart({
  data,
}: {
  data: Array<{ key: string; income: number; expense: number }>;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <div>
      <div className="flex h-48 items-end gap-3">
        {data.map((item) => (
          <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <div
                className="w-2.5 rounded-t bg-mint/80"
                style={{ height: `${Math.max(3, (item.income / max) * 100)}%` }}
                title={`Pemasukan ${formatRupiah(item.income)}`}
              />
              <div
                className="w-2.5 rounded-t bg-rose/80"
                style={{ height: `${Math.max(3, (item.expense / max) * 100)}%` }}
                title={`Pengeluaran ${formatRupiah(item.expense)}`}
              />
            </div>
            <span className="text-[11px] text-slate-500">{monthLabel(item.key)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-mint" /> Pemasukan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose" /> Pengeluaran
        </span>
      </div>
    </div>
  );
}

export function CategoryBars({
  data,
}: {
  data: Array<{ category: string; total: number; percent: number }>;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada pengeluaran bulan ini.</p>;
  }
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.category}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-700">{item.category}</span>
            <span className="text-slate-500">{formatRupiah(item.total)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-sky/80"
              style={{ width: `${Math.min(100, item.percent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
