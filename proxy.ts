import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Ambil token sesi dari cookies (mendukung cookie lokal & secure di produksi)
  const sessionToken =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__secure-better-auth.session_token');

  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // 1. Jika rute adalah dashboard tetapi tidak ada sesi aktif, alihkan ke /login
  if (isDashboardRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika rute adalah login/register tetapi sesi sudah aktif, alihkan ke /dashboard
  // if (isAuthRoute && sessionToken) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Jalankan proxy pada seluruh rute kecuali untuk API, file statis, optimasi gambar, dan aset .png/favicon
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
