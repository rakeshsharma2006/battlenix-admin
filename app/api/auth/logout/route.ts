import { NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  BACKEND_URL,
  REFRESH_COOKIE_NAME,
  buildAuthCookieOptions,
} from '@/lib/auth';

const LEGACY_COOKIE_NAME = 'token';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const accessToken = cookie.match(/battlenix_admin_token=([^;]+)/)?.[1];
  const refreshToken = cookie.match(/battlenix_admin_refresh_token=([^;]+)/)?.[1];

  if (accessToken) {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken ? decodeURIComponent(refreshToken) : '',
      }),
      cache: 'no-store',
    }).catch(() => null);
  }

  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  response.cookies.set(
    AUTH_COOKIE_NAME,
    '',
    buildAuthCookieOptions(0)
  );
  response.cookies.set(
    REFRESH_COOKIE_NAME,
    '',
    buildAuthCookieOptions(0)
  );
  response.cookies.set(
    LEGACY_COOKIE_NAME,
    '',
    buildAuthCookieOptions(0)
  );

  return response;
}
