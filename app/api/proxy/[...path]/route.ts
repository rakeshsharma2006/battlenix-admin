// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;

  if (!path.length) {
    return NextResponse.json({ message: 'Proxy path is required.' }, { status: 400 });
  }

  const targetUrl = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');
  // Extract JWT token from cookie
  let authToken: string | null = null;
  if (cookie) {
    const tokenMatch = cookie.match(/battlenix_admin_token=([^;]+)/);
    if (tokenMatch) {
      authToken = decodeURIComponent(tokenMatch[1]);
    }
  }
  const authorization = request.headers.get('authorization');
  const accept = request.headers.get('accept');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (cookie) {
    headers.set('cookie', cookie);
  }

  // Prefer cookie token over Authorization header
  if (authToken) {
    headers.set('authorization', `Bearer ${authToken}`);
  } else if (authorization) {
    headers.set('authorization', authorization);
  }

  if (accept) {
    headers.set('accept', accept);
  }

  try {
    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get('content-type');
    const setCookie = upstreamResponse.headers.get('set-cookie');

    if (upstreamContentType) {
      responseHeaders.set('content-type', upstreamContentType);
    }

    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    return new NextResponse(await upstreamResponse.text(), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
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
