import { NextRequest } from 'next/server';

import { getSession } from '@/lib/auth';
import { csvResponse } from '@/lib/csv';
import { todayJakarta } from '@/lib/format';
import { db } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function value(request: NextRequest, key: string) {
  const raw = request.nextUrl.searchParams.get(key);
  return raw && raw.trim() ? raw.trim() : undefined;
}

function jakarta(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const filters = {
    direction: value(request, 'direction'),
    q: value(request, 'q'),
    from: value(request, 'from'),
    to: value(request, 'to'),
  };

  let query = db()
    .from('conversation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(5000);

  if (filters.direction) query = query.eq('direction', filters.direction);
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00+07:00`);
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59+07:00`);
  if (filters.q) {
    const safe = filters.q.replace(/[%_]/g, '');
    query = query.ilike('text', `%${safe}%`);
  }

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const rows = [
    ['Waktu', 'Arah', 'Jenis', 'Pesan', 'Workflow', 'Intent', 'Message ID', 'Chat ID'],
    ...(data ?? []).map((log) => [
      jakarta(log.created_at),
      log.direction === 'out' ? 'Keluar' : 'Masuk',
      log.kind === 'text' ? 'Teks' : log.kind ?? 'Teks',
      log.text ?? '',
      log.workflow ?? '',
      log.intent ?? '',
      log.message_id ?? '',
      log.chat_id ?? '',
    ]),
  ];

  return csvResponse(`pundaria-log-${todayJakarta()}.csv`, rows);
}
