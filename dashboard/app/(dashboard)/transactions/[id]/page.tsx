import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Alert, Badge, Card, PageHeader } from '@/components/ui';
import { deleteTransaction, updateTransaction } from '@/lib/actions';
import { formatRupiah } from '@/lib/format';
import { str } from '@/lib/params';
import { getAccounts, getCategories, getTransaction } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [tx, accounts, categories] = await Promise.all([
    getTransaction(id),
    getAccounts(),
    getCategories(),
  ]);

  if (!tx) notFound();

  const activeAccounts = accounts.filter((account) => account.active);

  return (
    <>
      <PageHeader
        title={`Edit ${tx.id}`}
        subtitle={`${tx.kind} · ${formatRupiah(tx.amount)}`}
        action={
          <Link href="/transactions" className="btn">
            Kembali
          </Link>
        }
      />

      <Alert error={str(sp.error)} ok={str(sp.ok)} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Ubah transaksi" className="xl:col-span-2">
          <form action={updateTransaction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={tx.id} />
            <div>
              <label className="label" htmlFor="occurred_at">
                Tanggal
              </label>
              <input
                id="occurred_at"
                name="occurred_at"
                type="date"
                required
                defaultValue={tx.occurred_at.slice(0, 10)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Jenis</label>
              <div className="input flex items-center">
                <Badge tone={tx.kind === 'Pemasukan' ? 'mint' : tx.kind === 'Pengeluaran' ? 'rose' : 'sky'}>
                  {tx.kind}
                </Badge>
              </div>
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
                defaultValue={Math.round(Number(tx.amount))}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="category">
                Kategori
              </label>
              <input
                id="category"
                name="category"
                list="categories"
                defaultValue={tx.category}
                className="input"
                required
              />
              <datalist id="categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="account_id">
                Dompet
              </label>
              <select
                id="account_id"
                name="account_id"
                className="input"
                defaultValue={tx.account_id}
              >
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="note">
                Catatan
              </label>
              <input id="note" name="note" defaultValue={tx.note ?? ''} className="input" />
            </div>
            {tx.kind === 'Transfer' ? (
              <p className="text-xs text-slate-500 md:col-span-2">
                Transfer: dompet tujuan ({tx.to_account_id}) tidak bisa diubah dari form ini.
              </p>
            ) : null}
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" className="btn btn-primary">
                Simpan perubahan
              </button>
            </div>
          </form>
        </Card>

        <Card title="Hapus transaksi">
          <p className="text-sm text-slate-600">
            Transaksi akan dihapus dari daftar aktif. Tindakan ini tidak mengubah saldo dompet
            secara permanen.
          </p>
          <form action={deleteTransaction} className="mt-4">
            <input type="hidden" name="id" value={tx.id} />
            <button type="submit" className="btn btn-danger w-full">
              Hapus {tx.id}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
