// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  BACKEND_URL,
  REFRESH_COOKIE_NAME,
  buildAccessCookieOptions,
  buildAuthCookieOptions,
} from '@/lib/auth';

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;

  if (!path.length) {
    return NextResponse.json({ message: 'Proxy path is required.' }, { status: 400 });
  }

  const targetUrl = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;
  const buildHeaders = (accessToken?: string | null) => {
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    const authorization = request.headers.get('authorization');
    const accept = request.headers.get('accept');

    if (contentType) {
      headers.set('content-type', contentType);
    }

    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    } else if (authorization) {
      headers.set('authorization', authorization);
    }

    if (accept) {
      headers.set('accept', accept);
    }

    return headers;
  };

  const refreshAccessToken = async (refreshToken: string) => {
    const refreshResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      return null;
    }

    const data = await refreshResponse.json().catch(() => ({}));
    const accessToken = data.accessToken || data.token;
    if (!accessToken) {
      return null;
    }

    return {
      accessToken: String(accessToken),
      refreshToken: data.refreshToken ? String(data.refreshToken) : refreshToken,
    };
  };

  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');

  try {
    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

    const callUpstream = (token?: string | null) => fetch(targetUrl, {
      method: request.method,
      headers: buildHeaders(token),
      body,
      cache: 'no-store',
    });

    let upstreamResponse = await callUpstream(accessToken);
    let nextAccessToken: string | null = null;
    let nextRefreshToken: string | null = null;

    if (upstreamResponse.status === 401 && refreshToken && !authorization && contentType !== 'multipart/form-data') {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        nextAccessToken = refreshed.accessToken;
        nextRefreshToken = refreshed.refreshToken;
        upstreamResponse = await callUpstream(nextAccessToken);
      }
    }

    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get('content-type');
    const setCookie = upstreamResponse.headers.get('set-cookie');

    if (upstreamContentType) {
      responseHeaders.set('content-type', upstreamContentType);
    }

    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    const response = new NextResponse(await upstreamResponse.text(), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });

    if (nextAccessToken) {
      response.cookies.set(AUTH_COOKIE_NAME, nextAccessToken, buildAccessCookieOptions());
    }

    if (nextRefreshToken) {
      response.cookies.set(REFRESH_COOKIE_NAME, nextRefreshToken, buildAuthCookieOptions());
    }

    if (upstreamResponse.status === 401) {
      response.cookies.set(AUTH_COOKIE_NAME, '', buildAuthCookieOptions(0));
      response.cookies.set(REFRESH_COOKIE_NAME, '', buildAuthCookieOptions(0));
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Unable to connect to the backend service.' },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}
