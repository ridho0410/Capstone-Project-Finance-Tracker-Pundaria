import Link from 'next/link';
import type { ReactNode } from 'react';

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'mint',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'mint' | 'sky' | 'rose' | 'amber';
}) {
  const tones = {
    mint: 'text-mint bg-mint/10 ring-mint/20',
    sky: 'text-sky bg-sky/10 ring-sky/20',
    rose: 'text-rose bg-rose/10 ring-rose/20',
    amber: 'text-amber bg-amber/10 ring-amber/20',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full ring-4 ${tones[tone]}`} />
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'mint' | 'rose' | 'sky' | 'amber';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    mint: 'bg-mint/10 text-mint',
    rose: 'bg-rose/10 text-rose',
    sky: 'bg-sky/10 text-sky',
    amber: 'bg-amber/10 text-amber',
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alert({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        error
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-mint/30 bg-mint/10 text-mint'
      }`}
    >
      {error || (ok === '1' ? 'Perubahan tersimpan.' : ok)}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  basePath,
  query,
}: {
  page: number;
  pages: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value && key !== 'page') params.set(key, value);
    }
    params.set('page', String(n));
    return `${basePath}?${params.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        Halaman {page} dari {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link className="btn" href={href(page - 1)}>
            Sebelumnya
          </Link>
        )}
        {page < pages && (
          <Link className="btn" href={href(page + 1)}>
            Berikutnya
          </Link>
        )}
      </div>
    </div>
  );
}
