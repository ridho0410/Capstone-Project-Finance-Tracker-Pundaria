import Link from 'next/link';

import { Alert, Badge, Card, Empty, PageHeader, Pagination } from '@/components/ui';
import { createTransaction, createTransfer, deleteTransaction } from '@/lib/actions';
import { formatDate, formatRupiah, todayJakarta } from '@/lib/format';
import { intParam, str } from '@/lib/params';
import { getAccounts, getCategories, getTransactions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

function tone(kind: string) {
  if (kind === 'Pemasukan') return 'mint' as const;
  if (kind === 'Pengeluaran') return 'rose' as const;
  return 'sky' as const;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    from: str(sp.from),
    to: str(sp.to),
    kind: str(sp.kind),
    category: str(sp.category),
    account: str(sp.account),
    q: str(sp.q),
    page: intParam(sp.page),
  };

  const [result, accounts, categories] = await Promise.all([
    getTransactions(filters),
    getAccounts(),
    getCategories(),
  ]);

  const activeAccounts = accounts.filter((account) => account.active);
  const accountName = new Map(accounts.map((account) => [account.id, account.name]));
  const query = {
    from: filters.from,
    to: filters.to,
    kind: filters.kind,
    category: filters.category,
    account: filters.account,
    q: filters.q,
  };
  const exportParams = new URLSearchParams();
  for (const [key, val] of Object.entries(query)) {
    if (val) exportParams.set(key, val);
  }
  const exportHref = `/api/export/transactions${
    exportParams.toString() ? `?${exportParams.toString()}` : ''
  }`;

  return (
    <>
      <PageHeader
        title="Transaksi"
        subtitle={`${result.total} transaksi tercatat`}
        action={
          <div className="flex gap-2">
            <Link href={exportHref} className="btn" download>
              Export CSV
            </Link>
            <Link href="/" className="btn">
              Dashboard
            </Link>
          </div>
        }
      />

      <Alert error={str(sp.error)} ok={str(sp.ok)} />

      <div className="grid gap-4">
        <details className="card group">
          <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
            <span className="text-mint">+</span> Catat transaksi
          </summary>
          <form action={createTransaction} className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="occurred_at">
                Tanggal
              </label>
              <input
                id="occurred_at"
                name="occurred_at"
                type="date"
                required
                defaultValue={todayJakarta()}
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
              <input
                id="category"
                name="category"
                list="categories"
                className="input"
                placeholder="Makanan"
                required
              />
              <datalist id="categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
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
                placeholder="15000"
              />
            </div>
            <div>
              <label className="label" htmlFor="account_id">
                Dompet
              </label>
              <select id="account_id" name="account_id" className="input" required>
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
              <input id="note" name="note" className="input" placeholder="beli kopi" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary">
                Simpan transaksi
              </button>
            </div>
          </form>
        </details>

        <details className="card">
          <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
            <span className="text-sky">↔</span> Pindah dana antar dompet
          </summary>
          <form action={createTransfer} className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="from_account">
                Dari
              </label>
              <select id="from_account" name="from_account" className="input" required>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="to_account">
                Ke
              </label>
              <select id="to_account" name="to_account" className="input" required>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="transfer_amount">
                Nominal (Rp)
              </label>
              <input
                id="transfer_amount"
                name="amount"
                type="number"
                min="1"
                step="1"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="transfer_note">
                Catatan
              </label>
              <input id="transfer_note" name="note" className="input" placeholder="pindah dana" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn">
                Pindahkan
              </button>
            </div>
          </form>
        </details>

        <Card title="Filter">
          <form method="get" className="grid gap-3 md:grid-cols-6">
            <div>
              <label className="label" htmlFor="from">
                Dari
              </label>
              <input id="from" name="from" type="date" defaultValue={filters.from} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="to">
                Sampai
              </label>
              <input id="to" name="to" type="date" defaultValue={filters.to} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="filter_kind">
                Jenis
              </label>
              <select id="filter_kind" name="kind" defaultValue={filters.kind ?? ''} className="input">
                <option value="">Semua</option>
                <option value="Pemasukan">Pemasukan</option>
                <option value="Pengeluaran">Pengeluaran</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter_category">
                Kategori
              </label>
              <input
                id="filter_category"
                name="category"
                defaultValue={filters.category}
                className="input"
                placeholder="Makanan"
              />
            </div>
            <div>
              <label className="label" htmlFor="filter_account">
                Dompet
              </label>
              <select
                id="filter_account"
                name="account"
                defaultValue={filters.account ?? ''}
                className="input"
              >
                <option value="">Semua</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="q">
                Cari
              </label>
              <input id="q" name="q" defaultValue={filters.q} className="input" placeholder="catatan / ID" />
            </div>
            <div className="flex items-end gap-2 md:col-span-6">
              <button className="btn btn-primary" type="submit">
                Terapkan
              </button>
              <Link className="btn" href="/transactions">
                Reset
              </Link>
            </div>
          </form>
        </Card>

        <Card title="Daftar transaksi">
          {result.rows.length === 0 ? (
            <Empty>Tidak ada transaksi yang cocok.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tanggal</th>
                    <th>Jenis</th>
                    <th>Kategori</th>
                    <th>Catatan</th>
                    <th>Dompet</th>
                    <th className="text-right">Nominal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((tx) => (
                    <tr key={tx.id}>
                      <td className="font-mono text-xs text-slate-500">{tx.id}</td>
                      <td>{formatDate(tx.occurred_at)}</td>
                      <td>
                        <Badge tone={tone(tx.kind)}>{tx.kind}</Badge>
                      </td>
                      <td>{tx.category}</td>
                      <td className="max-w-[16rem] truncate">{tx.note || '-'}</td>
                      <td>
                        {tx.kind === 'Transfer'
                          ? `${accountName.get(tx.account_id) ?? tx.account_id} → ${
                              accountName.get(tx.to_account_id ?? '') ?? tx.to_account_id ?? '-'
                            }`
                          : accountName.get(tx.account_id) ?? tx.account_id}
                      </td>
                      <td className="money text-right">{formatRupiah(tx.amount)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/transactions/${tx.id}`}
                            className="text-xs text-slate-600 hover:text-slate-800"
                          >
                            Edit
                          </Link>
                          <form action={deleteTransaction}>
                            <input type="hidden" name="id" value={tx.id} />
                            <button
                              type="submit"
                              className="text-xs text-rose-600 hover:text-rose-700"
                            >
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
          <Pagination
            page={result.page}
            pages={result.pages}
            basePath="/transactions"
            query={query}
          />
        </Card>
      </div>
    </>
  );
}
