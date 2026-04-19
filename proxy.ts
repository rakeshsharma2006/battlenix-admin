import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'battlenix_admin_token';
const PROTECTED_PATHS = [
  '/dashboard',
  '/matches',
  '/payouts',
  '/players',
  '/payments',
];
const PUBLIC_PATHS = ['/login', '/signup'];

async function hasValidToken(token: string | undefined) {
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return false;
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isValidToken = await hasValidToken(token);

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !isValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);

    if (token) {
      response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        path: '/',
      });
    }

    return response;
  }

  if (isPublic && isValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
