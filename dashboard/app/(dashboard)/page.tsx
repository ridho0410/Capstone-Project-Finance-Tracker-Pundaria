import Link from 'next/link';

import { CategoryBars, TrendChart } from '@/components/charts';
import { Badge, Card, Empty, Kpi, PageHeader } from '@/components/ui';
import { formatDate, formatRupiah, todayJakarta } from '@/lib/format';
import { getDashboardData } from '@/lib/queries';

export const dynamic = 'force-dynamic';

function kindTone(kind: string) {
  if (kind === 'Pemasukan') return 'mint' as const;
  if (kind === 'Pengeluaran') return 'rose' as const;
  return 'sky' as const;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Ringkasan keuangan · ${formatDate(todayJakarta())}`}
        action={
          <Link href="/transactions" className="btn">
            Lihat transaksi
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total saldo" value={formatRupiah(data.totalBalance)} hint="Semua dompet" />
        <Kpi
          label="Pemasukan bulan ini"
          value={formatRupiah(data.monthIncome)}
          hint={`${data.monthIncomeCount} transaksi pemasukan`}
          tone="sky"
        />
        <Kpi
          label="Pengeluaran bulan ini"
          value={formatRupiah(data.monthExpense)}
          hint={`${data.monthExpenseCount} transaksi pengeluaran`}
          tone="rose"
        />
        <Kpi
          label="Arus kas bersih"
          value={formatRupiah(data.monthNet)}
          hint={`${data.monthNet >= 0 ? 'Surplus' : 'Defisit'} · ${
            data.monthIncomeCount + data.monthExpenseCount
          } transaksi`}
          tone={data.monthNet >= 0 ? 'mint' : 'amber'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Tren 6 bulan" className="xl:col-span-2">
          <TrendChart data={data.trend} />
        </Card>
        <Card title="Pengeluaran per kategori">
          <CategoryBars data={data.categories} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Dompet">
          {data.accounts.length === 0 ? (
            <Empty>Belum ada dompet.</Empty>
          ) : (
            <div className="space-y-3">
              {data.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-800">{account.name}</div>
                    <div className="text-[11px] text-slate-500">{account.kind}</div>
                  </div>
                  <div className="money text-sm font-medium">{formatRupiah(account.balance)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Anggaran bulan ini">
          {data.budgets.length === 0 ? (
            <Empty>Belum ada anggaran.</Empty>
          ) : (
            <div className="space-y-4">
              {data.budgets.map((budget) => (
                <div key={budget.category}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-700">{budget.category}</span>
                    <span className="text-slate-500">{budget.percent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        budget.percent > 100 ? 'bg-rose' : 'bg-mint'
                      }`}
                      style={{ width: `${Math.min(100, budget.percent)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {formatRupiah(budget.used)} / {formatRupiah(budget.monthly_limit)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Transaksi terakhir"
          action={
            <Link href="/transactions" className="text-xs text-slate-500 hover:text-slate-700">
              Semua
            </Link>
          }
        >
          {data.recent.length === 0 ? (
            <Empty>Belum ada transaksi.</Empty>
          ) : (
            <div className="space-y-3">
              {data.recent.map((tx) => (
                <div key={tx.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-slate-800">
                      {tx.note || tx.category}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <Badge tone={kindTone(tx.kind)}>{tx.kind}</Badge>
                      <span>{formatDate(tx.occurred_at)}</span>
                    </div>
                  </div>
                  <div className="money shrink-0 text-sm font-medium">
                    {formatRupiah(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
