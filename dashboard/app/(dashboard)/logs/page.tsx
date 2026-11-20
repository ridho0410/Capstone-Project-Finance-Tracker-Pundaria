import Link from 'next/link';

import { Badge, Card, Empty, PageHeader, Pagination } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { intParam, str } from '@/lib/params';
import { getConversationLogs } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    direction: str(sp.direction),
    q: str(sp.q),
    from: str(sp.from),
    to: str(sp.to),
    page: intParam(sp.page),
  };
  const result = await getConversationLogs(filters);
  const query = {
    direction: filters.direction,
    q: filters.q,
    from: filters.from,
    to: filters.to,
  };
  const exportParams = new URLSearchParams();
  for (const [key, val] of Object.entries(query)) {
    if (val) exportParams.set(key, val);
  }
  const exportHref = `/api/export/logs${
    exportParams.toString() ? `?${exportParams.toString()}` : ''
  }`;

  // Log masuk kadang tercatat beberapa milidetik setelah balasan bot.
  // Tukar pasangan berurutan supaya balasan bot tampil di atas pertanyaan user.
  const rows = [...result.rows];
  for (let i = 0; i < rows.length - 1; i++) {
    const inbound = rows[i];
    const outbound = rows[i + 1];
    if (inbound.direction !== 'in' || outbound.direction !== 'out') continue;
    const gap = new Date(inbound.created_at).getTime() - new Date(outbound.created_at).getTime();
    const idGap = (outbound.message_id ?? 0) - (inbound.message_id ?? 0);
    if (gap >= 0 && gap < 15000 && idGap > 0 && idGap <= 3) {
      rows[i] = outbound;
      rows[i + 1] = inbound;
      i++;
    }
  }

  return (
    <>
      <PageHeader
        title="Log Percakapan"
        subtitle={`${result.total} pesan tercatat`}
        action={
          <div className="flex gap-2">
            <Link href={exportHref} className="btn" download>
              Export CSV
            </Link>
            <Link href="/transactions" className="btn">
              Transaksi
            </Link>
          </div>
        }
      />

      <Card title="Filter">
        <form method="get" className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="label" htmlFor="direction">
              Arah
            </label>
            <select
              id="direction"
              name="direction"
              defaultValue={filters.direction ?? ''}
              className="input"
            >
              <option value="">Semua</option>
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
            </select>
          </div>
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
          <div className="md:col-span-2">
            <label className="label" htmlFor="q">
              Cari teks
            </label>
            <input id="q" name="q" defaultValue={filters.q} className="input" placeholder="kebab" />
          </div>
          <div className="flex items-end gap-2 md:col-span-5">
            <button className="btn btn-primary" type="submit">
              Terapkan
            </button>
            <Link className="btn" href="/logs">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <Card title="Percakapan" className="mt-4">
        {result.rows.length === 0 ? (
          <Empty>
            Belum ada log percakapan. Log akan terisi setelah workflow logging ditambahkan dan bot
            menerima pesan.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Arah</th>
                  <th>Jenis</th>
                  <th>Pesan</th>
                  <th>Workflow</th>
                  <th>Intent</th>
                  <th className="text-right">ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const out = row.direction === 'out';
                  const kind = row.kind ?? 'text';
                  const kindLabel = kind.toLowerCase() === 'text' ? 'Teks' : kind;
                  return (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap text-xs text-slate-600">
                        {formatDateTime(row.created_at)}
                      </td>
                      <td>
                        <Badge tone={out ? 'mint' : 'sky'}>{out ? 'Bot' : 'User'}</Badge>
                      </td>
                      <td className="text-xs text-slate-500">{kindLabel}</td>
                      <td className="w-[45%]">
                        <div className="whitespace-pre-wrap break-words text-sm text-slate-800">
                          {row.text || `[${kindLabel}]`}
                        </div>
                      </td>
                      <td className="text-xs text-slate-500">{row.workflow || '-'}</td>
                      <td>
                        {row.intent ? (
                          <Badge>{row.intent}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-right font-mono text-xs text-slate-400">
                        {row.message_id ?? '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} basePath="/logs" query={query} />
      </Card>
    </>
  );
}
