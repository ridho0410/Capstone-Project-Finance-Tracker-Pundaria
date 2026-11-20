import { Alert, Badge, Card, Empty, PageHeader } from '@/components/ui';
import { createAccount, deleteAccount } from '@/lib/actions';
import { formatRupiah } from '@/lib/format';
import { str } from '@/lib/params';
import { getDashboardData } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const data = await getDashboardData();

  return (
    <>
      <PageHeader title="Dompet" subtitle="Kelola akun dan saldo awal" />
      <Alert error={str(sp.error)} ok={str(sp.ok)} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Tambah dompet" className="xl:col-span-1">
          <form action={createAccount} className="grid gap-4">
            <div>
              <label className="label" htmlFor="name">
                Nama
              </label>
              <input id="name" name="name" required className="input" placeholder="BCA" />
            </div>
            <div>
              <label className="label" htmlFor="kind">
                Jenis
              </label>
              <select id="kind" name="kind" className="input" defaultValue="bank">
                <option value="bank">Bank</option>
                <option value="ewallet">E-wallet</option>
                <option value="cash">Cash</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="opening_balance">
                Saldo awal (Rp)
              </label>
              <input
                id="opening_balance"
                name="opening_balance"
                type="number"
                step="1"
                defaultValue={0}
                className="input"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="is_default" className="h-4 w-4 rounded border-line" />
              Jadikan dompet utama
            </label>
            <button type="submit" className="btn btn-primary">
              Simpan dompet
            </button>
          </form>
        </Card>

        <Card title="Daftar dompet" className="xl:col-span-2">
          {data.accounts.length === 0 ? (
            <Empty>Belum ada dompet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>ID</th>
                    <th>Jenis</th>
                    <th className="text-right">Saldo</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="font-medium text-slate-800">{account.name}</td>
                      <td className="font-mono text-xs text-slate-500">{account.id}</td>
                      <td>{account.kind}</td>
                      <td className="money text-right">{formatRupiah(account.balance)}</td>
                      <td>
                        {account.is_default ? <Badge tone="mint">Utama</Badge> : null}
                        {!account.active ? <Badge>Nonaktif</Badge> : null}
                      </td>
                      <td>
                        <div className="flex justify-end">
                          {account.id !== 'utama' ? (
                            <form action={deleteAccount}>
                              <input type="hidden" name="id" value={account.id} />
                              <button
                                type="submit"
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Hapus
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
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
