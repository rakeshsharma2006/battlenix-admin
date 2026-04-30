export const AUTH_COOKIE_NAME = 'battlenix_admin_token';
export const REFRESH_COOKIE_NAME = 'battlenix_admin_refresh_token';
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
export const ACCESS_COOKIE_MAX_AGE = 15 * 60;

export const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:5000';

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export type BackendUser = {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
};

export function isAdminRole(role?: string) {
  return role === 'admin' || role === 'manager';
}

export function mapAdminUser(user: BackendUser): AdminUser {
  return {
    _id: String(user._id ?? user.id ?? ''),
    name: user.name || user.username || user.email?.split('@')[0] || 'Admin',
    email: user.email || '',
    role: user.role || 'admin',
  };
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

export function buildAccessCookieOptions(maxAge = ACCESS_COOKIE_MAX_AGE) {
  return buildAuthCookieOptions(maxAge);
}
