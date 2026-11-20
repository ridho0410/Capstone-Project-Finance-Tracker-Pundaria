'use server';

import { timingSafeEqual } from 'node:crypto';

import { redirect } from 'next/navigation';

import { createSession } from '@/lib/auth';

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const expectedEmail = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const expectedPassword = String(process.env.ADMIN_PASSWORD ?? '');

  if (!expectedEmail || !expectedPassword) {
    redirect('/login?error=Konfigurasi admin belum diisi.');
  }

  if (!same(email, expectedEmail) || !same(password, expectedPassword)) {
    redirect('/login?error=Email atau password salah.');
  }

  await createSession(email);
  redirect('/');
}
