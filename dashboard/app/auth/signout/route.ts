import { NextResponse } from 'next/server';

import { destroySession } from '@/lib/auth';

export async function POST() {
  await destroySession();
  // Relative Location: request.url di container berisi host internal (0.0.0.0:3000).
  return new NextResponse(null, { status: 303, headers: { Location: '/login' } });
}
