import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  BACKEND_URL,
  REFRESH_COOKIE_NAME,
  buildAccessCookieOptions,
  buildAuthCookieOptions,
  isAdminRole,
  mapAdminUser,
} from '@/lib/auth';

async function fetchBackendMe(accessToken: string) {
  return fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  const accessToken = data.accessToken || data.token;
  if (!accessToken) {
    return null;
  }

  return {
    accessToken: String(accessToken),
    refreshToken: data.refreshToken ? String(data.refreshToken) : refreshToken,
  };
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', buildAuthCookieOptions(0));
  response.cookies.set(REFRESH_COOKIE_NAME, '', buildAuthCookieOptions(0));
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!token && !refreshToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    let accessToken = token;
    let backendResponse = accessToken ? await fetchBackendMe(accessToken) : null;
    let rotatedRefreshToken = refreshToken;

    if ((!backendResponse || backendResponse.status === 401) && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        accessToken = refreshed.accessToken;
        rotatedRefreshToken = refreshed.refreshToken;
        backendResponse = await fetchBackendMe(accessToken);
      }
    }

    if (!backendResponse?.ok) {
      const response = NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    const data = await backendResponse.json();
    const user = mapAdminUser(data.user || {});

    if (!isAdminRole(user.role)) {
      const response = NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.json(
      {
        user,
      },
      { status: 200 }
    );

    if (accessToken && accessToken !== token) {
      response.cookies.set(AUTH_COOKIE_NAME, accessToken, buildAccessCookieOptions());
    }

    if (rotatedRefreshToken && rotatedRefreshToken !== refreshToken) {
      response.cookies.set(REFRESH_COOKIE_NAME, rotatedRefreshToken, buildAuthCookieOptions());
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
