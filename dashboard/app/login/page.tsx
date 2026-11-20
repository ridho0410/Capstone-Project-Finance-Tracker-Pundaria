import { Icon } from '@/components/icons';

import { loginAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -left-32 top-[-10rem] h-80 w-80 rounded-full bg-mint/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-8rem] h-72 w-72 rounded-full bg-sky/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <img
            src="/pundaria-logo.svg"
            alt="Pundaria"
            className="h-11 w-11 rounded-2xl ring-1 ring-slate-200"
          />
          <div>
            <div className="text-lg font-semibold tracking-tight">Pundaria</div>
            <div className="text-xs text-slate-500">Asisten keuangan pribadi</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold tracking-tight">Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">Khusus admin.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form action={loginAction} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="input"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Masuk
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Data keuangan dilindungi sesi admin dan koneksi server.
        </p>
      </div>
    </main>
  );
}
