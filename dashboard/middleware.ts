import { NextResponse, type NextRequest } from 'next/server';

import { verifyToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('finance_session')?.value;
  const session = await verifyToken(token);
  const path = request.nextUrl.pathname;
  const isLogin = path === '/login';
  const isAuthRoute = path.startsWith('/auth/');

  if (!session && !isLogin && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (session && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|pundaria-logo|manifest.webmanifest|sw.js|icon-[a-z0-9-]+\\.png|apple-touch-icon\\.png).*)',
  ],
};
