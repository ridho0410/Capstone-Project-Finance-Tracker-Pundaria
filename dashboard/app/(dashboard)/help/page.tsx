import { Card, PageHeader } from '@/components/ui';

const perintah = [
  ['/help', 'Daftar perintah', '/help'],
  ['/saldo', 'Saldo tiap dompet', '/saldo'],
  ['/rekap', 'Rekap bulan berjalan', '/rekap'],
  ['/rekap 2026-10', 'Rekap bulan tertentu', '/rekap 2026-10'],
  ['/anggaran', 'Pemakaian dan sisa anggaran', '/anggaran'],
  ['/anggaran makanan 3000000', 'Set limit anggaran kategori', '/anggaran makanan 3000000'],
  ['/anggaran hapus makanan', 'Hapus anggaran kategori', '/anggaran hapus makanan'],
  ['/pindah 100000 BCA Gopay', 'Pindah dana antar dompet', '/pindah 100000 BCA Gopay'],
  ['/hapus OUT-0001', 'Hapus transaksi lewat ID', '/hapus OUT-0001'],
  ['/hapus beli kecap', 'Hapus transaksi lewat kata kunci', '/hapus beli kecap'],
  ['/undo', 'Batalkan transaksi terakhir', '/undo'],
  ['/dompet', 'Daftar dompet dan saldo', '/dompet'],
  ['/dompet tambah BCA', 'Buat dompet baru', '/dompet tambah Jago ewallet'],
];

const rutin = [
  ['/rutin', 'Daftar transaksi rutin', '/rutin'],
  ['/rutin tambah listrik 350000 5', 'Tambah rutin tanggal 5', '/rutin tambah listrik 350000 5'],
  ['/rutin tambah gaji 20000000 25 masuk', 'Rutin pemasukan tanggal 25', '/rutin tambah gaji 20000000 25 masuk'],
  ['/rutin hapus listrik', 'Hapus rutin', '/rutin hapus listrik'],
  ['/rutin matikan listrik', 'Nonaktifkan rutin', '/rutin matikan listrik'],
  ['/rutin hidupkan listrik', 'Aktifkan lagi', '/rutin hidupkan listrik'],
];

const pengingat = [
  ['/ingatkan', 'Daftar pengingat aktif', '/ingatkan'],
  ['/ingatkan besok urus stnk jam 9 pagi', 'Pengingat sekali', '/ingatkan besok urus stnk jam 9 pagi'],
  ['/ingatkan harian 06:00 minum obat', 'Pengingat harian', '/ingatkan harian 06:00 minum obat'],
  ['/ingatkan hapus 2', 'Nonaktifkan pengingat', '/ingatkan hapus 2'],
];

function CommandTable({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Perintah</th>
            <th>Fungsi</th>
            <th>Contoh</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, desc, example]) => (
            <tr key={name}>
              <td className="whitespace-nowrap font-mono text-xs text-slate-800">{name}</td>
              <td className="text-slate-600">{desc}</td>
              <td className="font-mono text-xs text-slate-500">{example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Bantuan" subtitle="Cara pakai Pundaria lewat Telegram dan dashboard" />

      <div className="grid gap-4">
        <Card title="Chat biasa (tanpa garis miring)">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600">Bot mencatat transaksi dari pesan biasa:</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">{`beli kopi 5rb
beli pulsa 10rb pakai gopay
pengeluaran hiburan nonton 50rb
gaji masuk 20 juta ke BCA
pemasukan ke dompet BCA 210rb`}</pre>
            </div>
            <div className="text-sm text-slate-600">
              <p>Foto struk dan pesan suara juga bisa dicatat.</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Kalau dompet tidak disebut, transaksi masuk ke dompet utama.</li>
                <li>
                  <span className="font-medium text-slate-800">Transfer antar dompet</span> memakai
                  <span className="font-mono text-xs"> /pindah</span>, bukan pemasukan.
                </li>
                <li>Kalau AI salah kategori, koreksi lewat dashboard Transaksi atau chat.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Perintah utama">
          <CommandTable rows={perintah} />
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Transaksi rutin">
            <CommandTable rows={rutin} />
          </Card>
          <Card title="Pengingat">
            <CommandTable rows={pengingat} />
            <p className="mt-3 text-xs text-slate-500">
              Aktifkan atau hapus permanen pengingat lewat dashboard Pengingat.
            </p>
          </Card>
        </div>

        <Card title="Dashboard">
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="font-medium text-slate-800">Transaksi</span> — lihat, tambah, ubah, hapus, export CSV.</li>
              <li><span className="font-medium text-slate-800">Dompet</span> — tambah dompet, jadikan utama, hapus jika belum dipakai.</li>
              <li><span className="font-medium text-slate-800">Anggaran</span> — limit kategori dan pemakaian.</li>
              <li><span className="font-medium text-slate-800">Rutin</span> — transaksi otomatis tiap bulan.</li>
            </ul>
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="font-medium text-slate-800">Pengingat</span> — sekali/harian, aktifkan, hapus.</li>
              <li><span className="font-medium text-slate-800">Log Percakapan</span> — audit chat, export CSV.</li>
              <li><span className="font-medium text-slate-800">Export CSV</span> — tombol di halaman Transaksi dan Log.</li>
              <li><span className="font-medium text-slate-800">Rekap email</span> — otomatis tanggal 1 pukul 07.00 WIB, CSV bulan sebelumnya.</li>
            </ul>
          </div>
        </Card>

        <Card title="Pasang sebagai aplikasi">
          <p className="text-sm text-slate-600">
            Dashboard bisa dipasang seperti aplikasi. Di Chrome/Edge klik ikon <span className="font-medium">Install</span> di
            address bar. Di Android pilih <span className="font-medium">Tambahkan ke layar utama</span>. Di iPhone buka
            Share lalu <span className="font-medium">Add to Home Screen</span>.
          </p>
        </Card>
      </div>
    </>
  );
}
