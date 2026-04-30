import { NextRequest, NextResponse } from 'next/server';

import {
  BACKEND_URL,
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  buildAccessCookieOptions,
  buildAuthCookieOptions,
  isAdminRole,
  mapAdminUser,
} from '@/lib/auth';

const LEGACY_COOKIE_NAME = 'token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Invalid email or password' },
        { status: backendResponse.status }
      );
    }

    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;
    const user = mapAdminUser(data.user || {});

    if (!accessToken || !refreshToken || !isAdminRole(user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user,
      },
      { status: 200 }
    );

    response.cookies.set(
      AUTH_COOKIE_NAME,
      accessToken,
      buildAccessCookieOptions()
    );
    response.cookies.set(
      REFRESH_COOKIE_NAME,
      refreshToken,
      buildAuthCookieOptions()
    );
    response.cookies.set(LEGACY_COOKIE_NAME, '', buildAuthCookieOptions(0));

    console.info('[auth/login] login successful', {
      email,
      userId: user._id,
    });

    return response;
  } catch (error) {
    console.error('[auth/login] unexpected error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { message: 'Login failed' },
      { status: 500 }
    );
  }
}
