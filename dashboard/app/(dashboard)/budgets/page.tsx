import { Alert, Card, Empty, PageHeader } from '@/components/ui';
import { deleteBudget, setBudget } from '@/lib/actions';
import { formatRupiah } from '@/lib/format';
import { str } from '@/lib/params';
import { getDashboardData } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const data = await getDashboardData();

  return (
    <>
      <PageHeader title="Anggaran" subtitle="Batas pengeluaran bulanan per kategori" />
      <Alert error={str(sp.error)} ok={str(sp.ok)} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Set anggaran">
          <form action={setBudget} className="grid gap-4">
            <div>
              <label className="label" htmlFor="category">
                Kategori
              </label>
              <input
                id="category"
                name="category"
                required
                className="input"
                placeholder="Makanan"
              />
            </div>
            <div>
              <label className="label" htmlFor="monthly_limit">
                Limit bulanan (Rp)
              </label>
              <input
                id="monthly_limit"
                name="monthly_limit"
                type="number"
                min="1"
                step="1"
                required
                className="input"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Simpan anggaran
            </button>
          </form>
        </Card>

        <Card title="Pemakaian bulan ini" className="xl:col-span-2">
          {data.budgets.length === 0 ? (
            <Empty>Belum ada anggaran aktif.</Empty>
          ) : (
            <div className="space-y-5">
              {data.budgets.map((budget) => (
                <div key={budget.category}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{budget.category}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {formatRupiah(budget.used)} dari {formatRupiah(budget.monthly_limit)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs ${budget.percent > 100 ? 'text-rose' : 'text-slate-600'}`}
                      >
                        {budget.percent}%
                      </span>
                      <form action={deleteBudget}>
                        <input type="hidden" name="category" value={budget.category} />
                        <button
                          type="submit"
                          className="text-xs text-rose-600 hover:text-rose-700"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${budget.percent > 100 ? 'bg-rose' : 'bg-mint'}`}
                      style={{ width: `${Math.min(100, budget.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Notifikasi Telegram" className="mt-4">
        <p className="text-sm text-slate-600">
          Bot mengirim pemberitahuan ke Telegram saat transaksi lewat bot membuat pemakaian
          anggaran mencapai 80% dan 100%.
        </p>
      </Card>
    </>
  );
}
