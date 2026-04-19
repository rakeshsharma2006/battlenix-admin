import { NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload?.userId) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId).lean();

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
