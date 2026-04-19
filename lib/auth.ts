import jwt, { type JwtPayload } from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'battlenix_admin_token';
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export type AuthTokenPayload = JwtPayload & {
  userId: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Please define the JWT_SECRET environment variable');
  }

  return secret;
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function buildAuthCookieOptions(maxAge = AUTH_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  };
}
