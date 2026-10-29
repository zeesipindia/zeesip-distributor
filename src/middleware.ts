import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and auth API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout')
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  const isAdminRole = session?.role === 'admin' || session?.role === 'zeesip_admin';

  // 3. Handle landing page "/"
  if (pathname === '/') {
    if (session) {
      if (isAdminRole) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // 4. API routes protection
  if (pathname.startsWith('/api/admin')) {
    if (!session || !isAdminRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 5. Admin routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdminRole) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 6. User dashboard (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminRole) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 7. Protected route fallback
  if (!session) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
