import { Alert, Badge, Card, Empty, PageHeader } from '@/components/ui';
import { addRecurring, deleteRecurring, toggleRecurring } from '@/lib/actions';
import { formatDate, formatRupiah } from '@/lib/format';
import { str } from '@/lib/params';
import { getRecurring } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rows = await getRecurring();

  return (
    <>
      <PageHeader title="Transaksi Rutin" subtitle="Tagihan atau pemasukan berulang" />
      <Alert error={str(sp.error)} ok={str(sp.ok)} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Tambah rutin">
          <form action={addRecurring} className="grid gap-4">
            <div>
              <label className="label" htmlFor="name">
                Nama
              </label>
              <input id="name" name="name" required className="input" placeholder="listrik" />
            </div>
            <div>
              <label className="label" htmlFor="amount">
                Nominal (Rp)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="1"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="day_of_month">
                Tanggal (1–28)
              </label>
              <input
                id="day_of_month"
                name="day_of_month"
                type="number"
                min="1"
                max="28"
                required
                defaultValue={5}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="kind">
                Jenis
              </label>
              <select id="kind" name="kind" className="input" defaultValue="Pengeluaran">
                <option value="Pengeluaran">Pengeluaran</option>
                <option value="Pemasukan">Pemasukan</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="category">
                Kategori
              </label>
              <input id="category" name="category" className="input" defaultValue="Tagihan" />
            </div>
            <button type="submit" className="btn btn-primary">
              Simpan rutin
            </button>
          </form>
        </Card>

        <Card title="Daftar rutin" className="xl:col-span-2">
          {rows.length === 0 ? (
            <Empty>Belum ada transaksi rutin.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Nominal</th>
                    <th>Tanggal</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-800">{row.name}</td>
                      <td className="money">{formatRupiah(row.amount)}</td>
                      <td>{row.day_of_month}</td>
                      <td>
                        {row.kind} · {row.category}
                      </td>
                      <td>
                        <Badge tone={row.active ? 'mint' : 'slate'}>
                          {row.active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        {row.last_run && (
                          <span className="ml-2 text-[11px] text-slate-500">
                            {formatDate(row.last_run)}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-3">
                          <form action={toggleRecurring}>
                            <input type="hidden" name="name" value={row.name} />
                            <input type="hidden" name="active" value={String(!row.active)} />
                            <button className="text-xs text-slate-600 hover:text-slate-800">
                              {row.active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </form>
                          <form action={deleteRecurring}>
                            <input type="hidden" name="name" value={row.name} />
                            <button className="text-xs text-rose-600 hover:text-rose-700">
                              Hapus
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
