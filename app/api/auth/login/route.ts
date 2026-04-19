import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  signToken,
} from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

const LEGACY_COOKIE_NAME = 'token';

function looksLikeBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

function getUserDisplayName(user: { name?: string | null; email: string } & { get?: (path: string) => unknown }) {
  const username = user.get?.('username');

  if (typeof user.name === 'string' && user.name.trim()) {
    return user.name;
  }

  if (typeof username === 'string' && username.trim()) {
    return username;
  }

  return user.email.split('@')[0];
}

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

    await connectDB();

    const user = await User.findOne({ email }).select('+password');

    console.info('[auth/login] lookup complete', {
      email,
      userFound: Boolean(user),
    });

    if (!user) {
      console.warn('[auth/login] user not found', { email });
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (typeof user.password !== 'string' || !user.password) {
      console.warn('[auth/login] user missing password', {
        email,
        userId: user._id.toString(),
      });

      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordIsHashed = looksLikeBcryptHash(user.password);
    let isPasswordValid = false;

    if (passwordIsHashed) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;

      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        console.warn('[auth/login] migrated legacy plaintext password', {
          email,
          userId: user._id.toString(),
        });
      }
    }

    console.info('[auth/login] password check complete', {
      email,
      userId: user._id.toString(),
      passwordIsHashed,
      passwordMatch: isPasswordValid,
    });

    if (!isPasswordValid) {
      console.warn('[auth/login] invalid password', {
        email,
        userId: user._id.toString(),
      });

      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signToken(user._id.toString());

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          _id: user._id.toString(),
          name: getUserDisplayName(user),
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      buildAuthCookieOptions()
    );
    response.cookies.set(LEGACY_COOKIE_NAME, '', buildAuthCookieOptions(0));

    console.info('[auth/login] login successful', {
      email,
      userId: user._id.toString(),
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
