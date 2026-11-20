'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '@/components/icons';

const items = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' as const },
  { href: '/transactions', label: 'Transaksi', icon: 'transactions' as const },
  { href: '/accounts', label: 'Dompet', icon: 'wallet' as const },
  { href: '/budgets', label: 'Anggaran', icon: 'budget' as const },
  { href: '/recurring', label: 'Rutin', icon: 'repeat' as const },
  { href: '/reminders', label: 'Pengingat', icon: 'bell' as const },
  { href: '/logs', label: 'Log Percakapan', icon: 'logs' as const },
  { href: '/help', label: 'Bantuan', icon: 'help' as const },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-line bg-white px-4 py-6 md:flex md:flex-col">
        <div className="flex items-center gap-3 px-2">
          <img
            src="/pundaria-logo.svg"
            alt="Pundaria"
            className="h-11 w-11 rounded-xl ring-1 ring-slate-200"
          />
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-900">Pundaria</div>
            <div className="text-[11px] text-slate-500">Asisten keuangan pribadi</div>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-mint/10 font-medium text-mint'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-line pt-4">
          <div className="truncate px-2 text-xs text-slate-500">{email}</div>
          <form action="/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <Icon name="logout" className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="border-b border-line bg-white/95 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <img src="/pundaria-logo.svg" alt="" className="h-8 w-8 rounded-lg" />
            Pundaria
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-slate-600" type="submit">
              Keluar
            </button>
          </form>
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition ${
                  active
                    ? 'bg-mint/10 font-medium text-mint'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
