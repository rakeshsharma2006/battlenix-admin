import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, buildAuthCookieOptions } from '@/lib/auth';

const LEGACY_COOKIE_NAME = 'token';

export async function POST() {
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
    LEGACY_COOKIE_NAME,
    '',
    buildAuthCookieOptions(0)
  );

  return response;
}
