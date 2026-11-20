import { NextRequest } from 'next/server';

import { getSession } from '@/lib/auth';
import { csvResponse } from '@/lib/csv';
import { todayJakarta } from '@/lib/format';
import { getAccounts } from '@/lib/queries';
import { db } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function value(request: NextRequest, key: string) {
  const raw = request.nextUrl.searchParams.get(key);
  return raw && raw.trim() ? raw.trim() : undefined;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const filters = {
    from: value(request, 'from'),
    to: value(request, 'to'),
    kind: value(request, 'kind'),
    category: value(request, 'category'),
    account: value(request, 'account'),
    q: value(request, 'q'),
  };

  let query = db()
    .from('transactions')
    .select('*')
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(5000);

  if (filters.from) query = query.gte('occurred_at', filters.from);
  if (filters.to) query = query.lte('occurred_at', filters.to);
  if (filters.kind) query = query.eq('kind', filters.kind);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.account) query = query.eq('account_id', filters.account);
  if (filters.q) {
    const safe = filters.q.replace(/[%_]/g, '');
    query = query.or(`note.ilike.%${safe}%,category.ilike.%${safe}%,id.ilike.%${safe}%`);
  }

  const [{ data, error }, accounts] = await Promise.all([query, getAccounts()]);
  if (error) return new Response(error.message, { status: 500 });

  const accountName = new Map(accounts.map((account) => [account.id, account.name]));
  const rows = [
    ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Dompet', 'Nominal'],
    ...(data ?? []).map((tx) => {
      const wallet =
        tx.kind === 'Transfer'
          ? `${accountName.get(tx.account_id) ?? tx.account_id} -> ${
              accountName.get(tx.to_account_id ?? '') ?? tx.to_account_id ?? ''
            }`
          : accountName.get(tx.account_id) ?? tx.account_id;
      return [
        tx.id,
        String(tx.occurred_at).slice(0, 10),
        tx.kind,
        tx.category,
        tx.note ?? '',
        wallet,
        tx.amount,
      ];
    }),
  ];

  return csvResponse(`pundaria-transaksi-${todayJakarta()}.csv`, rows);
}
