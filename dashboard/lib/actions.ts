'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireSession } from '@/lib/auth';
import { slugify } from '@/lib/format';
import { db } from '@/lib/supabase/admin';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function amount(formData: FormData, key: string) {
  return Number(String(formData.get(key) ?? '0').replace(/[^0-9]/g, ''));
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function ok(path: string): never {
  redirect(`${path}?ok=1`);
}

function dateValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function createTransaction(formData: FormData) {
  await requireSession();
  const occurred = dateValue(formData, 'occurred_at');
  const kind = text(formData, 'kind');
  const category = text(formData, 'category') || 'Lainnya';
  const note = text(formData, 'note');
  const account = text(formData, 'account_id');
  const value = amount(formData, 'amount');

  if (!occurred) fail('/transactions', 'Tanggal tidak valid.');
  if (!['Pemasukan', 'Pengeluaran'].includes(kind)) fail('/transactions', 'Jenis transaksi tidak valid.');
  if (!Number.isFinite(value) || value <= 0) fail('/transactions', 'Nominal harus lebih dari 0.');
  if (!account) fail('/transactions', 'Dompet wajib dipilih.');

  const { error } = await db().rpc('catat_transaksi', {
    p_occurred: occurred,
    p_kind: kind,
    p_category: category,
    p_amount: value,
    p_note: note,
    p_message_id: null,
    p_account: account,
  });

  if (error) fail('/transactions', error.message);
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  ok('/transactions');
}

export async function createTransfer(formData: FormData) {
  await requireSession();
  const from = text(formData, 'from_account');
  const to = text(formData, 'to_account');
  const note = text(formData, 'note');
  const value = amount(formData, 'amount');

  if (!from || !to) fail('/transactions', 'Dompet asal dan tujuan wajib dipilih.');
  if (from === to) fail('/transactions', 'Dompet asal dan tujuan tidak boleh sama.');
  if (!Number.isFinite(value) || value <= 0) fail('/transactions', 'Nominal harus lebih dari 0.');

  const { data, error } = await db().rpc('pindah_dana', {
    p_amount: value,
    p_from: from,
    p_to: to,
    p_note: note,
    p_message_id: null,
  });

  if (error) fail('/transactions', error.message);
  if (typeof data === 'string' && !data.startsWith('Transfer tercatat')) fail('/transactions', data);
  revalidatePath('/');
  revalidatePath('/transactions');
  ok('/transactions');
}

export async function updateTransaction(formData: FormData) {
  await requireSession();
  const id = text(formData, 'id');
  const occurred = dateValue(formData, 'occurred_at');
  const category = text(formData, 'category') || 'Lainnya';
  const note = text(formData, 'note');
  const account = text(formData, 'account_id');
  const value = amount(formData, 'amount');

  if (!id) fail('/transactions', 'ID transaksi tidak valid.');
  if (!occurred) fail(`/transactions/${id}`, 'Tanggal tidak valid.');
  if (!Number.isFinite(value) || value <= 0) fail(`/transactions/${id}`, 'Nominal harus lebih dari 0.');

  const { error } = await db().rpc('ubah_transaksi', {
    p_id: id,
    p_amount: value,
    p_category: category,
    p_note: note,
    p_occurred: occurred,
    p_account: account || null,
  });

  if (error) fail(`/transactions/${id}`, error.message);
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath(`/transactions/${id}`);
  ok('/transactions');
}

export async function deleteTransaction(formData: FormData) {
  await requireSession();
  const id = text(formData, 'id');
  if (!id) fail('/transactions', 'ID transaksi tidak valid.');

  const { error } = await db().rpc('hapus_transaksi', { p_id: id });
  if (error) fail('/transactions', error.message);
  revalidatePath('/');
  revalidatePath('/transactions');
  ok('/transactions');
}

export async function createAccount(formData: FormData) {
  await requireSession();
  const name = text(formData, 'name');
  const kind = text(formData, 'kind') || 'bank';
  const opening = amount(formData, 'opening_balance');
  const makeDefault = text(formData, 'is_default') === 'on';

  if (!name) fail('/accounts', 'Nama dompet wajib diisi.');
  const id = slugify(name);
  if (!id) fail('/accounts', 'Nama dompet tidak valid.');

  if (makeDefault) {
    const { error: clearError } = await db()
      .from('accounts')
      .update({ is_default: false })
      .eq('is_default', true);
    if (clearError) fail('/accounts', clearError.message);
  }

  const { error } = await db().from('accounts').insert({
    id,
    name,
    kind,
    opening_balance: Number.isFinite(opening) ? opening : 0,
    is_default: makeDefault,
    active: true,
  });
  if (error) fail('/accounts', error.message);
  revalidatePath('/accounts');
  revalidatePath('/');
  ok('/accounts');
}

export async function deleteAccount(formData: FormData) {
  await requireSession();
  const id = text(formData, 'id');
  if (!id) fail('/accounts', 'Dompet tidak valid.');
  if (id === 'utama') fail('/accounts', 'Dompet utama tidak boleh dihapus.');

  const { count, error: countError } = await db()
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .or(`account_id.eq.${id},to_account_id.eq.${id}`);
  if (countError) fail('/accounts', countError.message);
  if ((count ?? 0) > 0) fail('/accounts', 'Dompet masih dipakai transaksi. Nonaktifkan saja.');

  const { error } = await db().from('accounts').delete().eq('id', id);
  if (error) fail('/accounts', error.message);
  revalidatePath('/accounts');
  ok('/accounts');
}

export async function setBudget(formData: FormData) {
  await requireSession();
  const category = text(formData, 'category');
  const limit = amount(formData, 'monthly_limit');
  if (!category) fail('/budgets', 'Kategori wajib diisi.');
  if (!Number.isFinite(limit) || limit <= 0) fail('/budgets', 'Limit harus lebih dari 0.');

  const { data, error } = await db().rpc('anggaran_set', {
    p_kategori: category,
    p_limit: limit,
  });
  if (error) fail('/budgets', error.message);
  if (typeof data === 'string' && data.toLowerCase().includes('format')) fail('/budgets', data);
  revalidatePath('/budgets');
  revalidatePath('/');
  ok('/budgets');
}

export async function deleteBudget(formData: FormData) {
  await requireSession();
  const name = text(formData, 'category');
  if (!name) fail('/budgets', 'Kategori tidak valid.');
  const { error } = await db().rpc('anggaran_hapus', { p_nama: name });
  if (error) fail('/budgets', error.message);
  revalidatePath('/budgets');
  revalidatePath('/');
  ok('/budgets');
}

export async function addRecurring(formData: FormData) {
  await requireSession();
  const name = text(formData, 'name');
  const value = amount(formData, 'amount');
  const day = Number(text(formData, 'day_of_month'));
  const kind = text(formData, 'kind') || 'Pengeluaran';
  const category = text(formData, 'category') || 'Tagihan';

  if (!name) fail('/recurring', 'Nama rutin wajib diisi.');
  if (!Number.isFinite(value) || value <= 0) fail('/recurring', 'Nominal harus lebih dari 0.');
  if (!Number.isInteger(day) || day < 1 || day > 28) fail('/recurring', 'Tanggal harus 1–28.');

  const { data, error } = await db().rpc('rutin_tambah', {
    p_nama: name,
    p_nominal: value,
    p_tanggal: day,
    p_kind: kind,
    p_kategori: category,
  });
  if (error) fail('/recurring', error.message);
  if (typeof data === 'string' && data.toLowerCase().includes('format')) fail('/recurring', data);
  revalidatePath('/recurring');
  ok('/recurring');
}

export async function toggleRecurring(formData: FormData) {
  await requireSession();
  const name = text(formData, 'name');
  const active = text(formData, 'active') === 'true';
  if (!name) fail('/recurring', 'Nama rutin tidak valid.');
  const { error } = await db().rpc('rutin_set', { p_nama: name, p_aktif: active });
  if (error) fail('/recurring', error.message);
  revalidatePath('/recurring');
  ok('/recurring');
}

export async function deleteRecurring(formData: FormData) {
  await requireSession();
  const name = text(formData, 'name');
  if (!name) fail('/recurring', 'Nama rutin tidak valid.');
  const { error } = await db().rpc('rutin_hapus', { p_nama: name });
  if (error) fail('/recurring', error.message);
  revalidatePath('/recurring');
  ok('/recurring');
}

export async function addReminder(formData: FormData) {
  await requireSession();
  const teks = text(formData, 'teks');
  const pola = text(formData, 'pola') || 'sekali';
  const at = text(formData, 'at');
  const jam = text(formData, 'jam');

  if (!teks) fail('/reminders', 'Teks pengingat wajib diisi.');
  if (!['sekali', 'harian'].includes(pola)) fail('/reminders', 'Pola tidak valid.');

  let p_at: string | null = null;
  let p_jam: string | null = null;
  if (pola === 'harian') {
    if (!/^\d{2}:\d{2}$/.test(jam)) fail('/reminders', 'Jam harian tidak valid.');
    p_jam = `${jam}:00`;
  } else {
    if (!at) fail('/reminders', 'Waktu pengingat wajib diisi.');
    const date = new Date(`${at}:00+07:00`);
    if (Number.isNaN(date.getTime())) fail('/reminders', 'Waktu pengingat tidak valid.');
    p_at = date.toISOString();
  }

  const { data, error } = await db().rpc('ingatkan_tambah', {
    p_teks: teks,
    p_pola: pola,
    p_at,
    p_jam,
  });
  if (error) fail('/reminders', error.message);
  if (typeof data === 'string' && data.toLowerCase().includes('format')) fail('/reminders', data);
  revalidatePath('/reminders');
  ok('/reminders');
}

export async function deleteReminder(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, 'id'));
  if (!Number.isInteger(id) || id <= 0) fail('/reminders', 'ID pengingat tidak valid.');
  const { error } = await db().rpc('ingatkan_hapus', { p_id: id });
  if (error) fail('/reminders', error.message);
  revalidatePath('/reminders');
  ok('/reminders');
}

export async function deleteReminderPermanent(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, 'id'));
  if (!Number.isInteger(id) || id <= 0) fail('/reminders', 'ID pengingat tidak valid.');
  const { error } = await db().from('reminders').delete().eq('id', id);
  if (error) fail('/reminders', error.message);
  revalidatePath('/reminders');
  ok('/reminders');
}

export async function activateReminder(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, 'id'));
  if (!Number.isInteger(id) || id <= 0) fail('/reminders', 'ID pengingat tidak valid.');

  const { data: row, error: readError } = await db()
    .from('reminders')
    .select('id, pola, jam, aktif')
    .eq('id', id)
    .maybeSingle();
  if (readError) fail('/reminders', readError.message);
  if (!row) fail('/reminders', 'Pengingat tidak ditemukan.');
  if (row.aktif) fail('/reminders', 'Pengingat sudah aktif.');
  if (row.pola !== 'harian' || !row.jam) {
    fail(
      '/reminders',
      'Hanya pengingat harian yang bisa diaktifkan. Pengingat sekali yang sudah lewat, buat baru.',
    );
  }

  const [hour, minute] = String(row.jam).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    fail('/reminders', 'Jam pengingat tidak valid.');
  }

  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 3600_000);
  let next = new Date(
    Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), hour, minute) -
      7 * 3600_000,
  );
  if (next.getTime() <= now.getTime()) next = new Date(next.getTime() + 24 * 3600_000);

  const { error } = await db()
    .from('reminders')
    .update({ aktif: true, next_run_at: next.toISOString() })
    .eq('id', id)
    .eq('aktif', false);
  if (error) fail('/reminders', error.message);
  revalidatePath('/reminders');
  ok('/reminders');
}
