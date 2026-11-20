import { Alert, Badge, Card, Empty, PageHeader } from '@/components/ui';
import {
  activateReminder,
  addReminder,
  deleteReminder,
  deleteReminderPermanent,
} from '@/lib/actions';
import { formatDateTime } from '@/lib/format';
import { str } from '@/lib/params';
import { getReminders } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rows = await getReminders();

  return (
    <>
      <PageHeader title="Pengingat" subtitle="Pengingat sekali atau harian" />
      <Alert error={str(sp.error)} ok={str(sp.ok)} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Tambah pengingat">
          <form action={addReminder} className="grid gap-4">
            <div>
              <label className="label" htmlFor="teks">
                Teks
              </label>
              <input id="teks" name="teks" required className="input" placeholder="bayar listrik" />
            </div>
            <div>
              <label className="label" htmlFor="pola">
                Pola
              </label>
              <select id="pola" name="pola" className="input" defaultValue="sekali">
                <option value="sekali">Sekali</option>
                <option value="harian">Harian</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="at">
                Tanggal & waktu (untuk sekali)
              </label>
              <input id="at" name="at" type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="jam">
                Jam (untuk harian)
              </label>
              <input id="jam" name="jam" type="time" className="input" />
            </div>
            <p className="text-[11px] text-slate-500">
              Isi salah satu: tanggal & waktu untuk “sekali”, atau jam untuk “harian”.
            </p>
            <button type="submit" className="btn btn-primary">
              Simpan pengingat
            </button>
          </form>
        </Card>

        <Card title="Daftar pengingat" className="xl:col-span-2">
          {rows.length === 0 ? (
            <Empty>Belum ada pengingat.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teks</th>
                    <th>Pola</th>
                    <th>Jadwal</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-800">{row.teks}</td>
                      <td>{row.pola}</td>
                      <td className="text-xs text-slate-600">{formatDateTime(row.next_run_at)}</td>
                      <td>
                        <Badge tone={row.aktif ? 'mint' : 'slate'}>
                          {row.aktif ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          {row.aktif ? (
                            <form action={deleteReminder}>
                              <input type="hidden" name="id" value={row.id} />
                              <button className="text-xs text-rose-600 hover:text-rose-700">
                                Nonaktifkan
                              </button>
                            </form>
                          ) : (
                            <div className="flex justify-end gap-3">
                              {row.pola === 'harian' ? (
                                <form action={activateReminder}>
                                  <input type="hidden" name="id" value={row.id} />
                                  <button
                                    className="text-xs text-emerald-600 hover:text-emerald-700"
                                    title="Aktifkan pengingat harian"
                                  >
                                    Aktifkan
                                  </button>
                                </form>
                              ) : null}
                              <form action={deleteReminderPermanent}>
                                <input type="hidden" name="id" value={row.id} />
                                <button
                                  className="text-xs text-rose-600 hover:text-rose-700"
                                  title="Hapus permanen"
                                >
                                  Hapus
                                </button>
                              </form>
                            </div>
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
