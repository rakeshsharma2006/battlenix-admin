// lib/admin-utils.ts
import axios from 'axios';

import type { AdminUser } from '@/context/AuthContext';
import type { DashboardStats, Match, Payment, Player, Withdrawal } from '@/types';

export const ADMIN_COLORS = {
  bgPrimary: '#0A0A0F',
  bgSurface: '#0F0F17',
  bgCard: '#13131E',
  bgElevated: '#1A1A28',
  border: '#1E2035',
  borderActive: '#2D2F55',
  purple600: '#7C3AED',
  purple500: '#8B5CF6',
  purple400: '#A78BFA',
  purpleGlow: 'rgba(124,58,237,0.15)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  gold: '#F59E0B',
} as const;

const PAGE_META = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Real-time overview of BattleNix operations.',
  },
  '/matches': {
    title: 'Matches',
    subtitle: 'Control match lifecycle, scheduling, and status updates.',
  },
  '/matches/create': {
    title: 'Create Match',
    subtitle: 'Configure a new BGMI tournament slot and preview payouts.',
  },
  '/slots': {
    title: 'Slot Manager',
    subtitle: 'Manage time-based lobby slots, capacity, and fill rates.',
  },
  '/withdrawals': {
    title: 'Withdrawals',
    subtitle: 'Review payout requests and process pending approvals.',
  },
  '/players': {
    title: 'Players',
    subtitle: 'Monitor player accounts, balances, and access controls.',
  },
  '/payments': {
    title: 'Payments',
    subtitle: 'Track financial activity across deposits, fees, and prizes.',
  },
} as const;

export function getPageMeta(pathname: string) {
  const resolvedPath = Object.keys(PAGE_META).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  ) as keyof typeof PAGE_META | undefined;

  return (
    (resolvedPath ? PAGE_META[resolvedPath] : undefined) ?? {
      title: 'BattleNix Admin',
      subtitle: 'Manage tournaments, players, and payouts.',
    }
  );
}

export function getAdminDisplayName(admin: AdminUser | null | undefined) {
  if (admin?.name?.trim()) {
    return admin.name.trim();
  }

  if (admin?.email?.includes('@')) {
    return admin.email.split('@')[0];
  }

  return 'Admin';
}

export function getAdminInitial(admin: AdminUser | null | undefined) {
  return getAdminDisplayName(admin).charAt(0).toUpperCase();
}

export function formatCurrency(amount: number) {
  return `\u20B9${Number(amount ?? 0).toLocaleString('en-IN')}`;
}

export function formatDate(
  dateStr: string | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }
) {
  if (!dateStr) {
    return '-';
  }

  return new Date(dateStr).toLocaleDateString('en-IN', options);
}

export function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) {
    return '-';
  }

  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMatchSchedule(dateStr: string | undefined) {
  if (!dateStr) {
    return '-';
  }

  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string | undefined) {
  if (!dateStr) {
    return '-';
  }

  const date = new Date(dateStr);
  const diffInMs = date.getTime() - Date.now();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'day');
  }

  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  }

  const diffInYears = Math.round(diffInMonths / 12);
  return rtf.format(diffInYears, 'year');
}

export function isToday(dateStr: string | undefined) {
  if (!dateStr) {
    return false;
  }

  const date = new Date(dateStr);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  );
}

export function truncateText(value: string, length: number) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length)}...`;
}

export function formatPaymentType(type: Payment['type']) {
  return type === 'entry_fee' ? 'Entry Fee' : type.charAt(0).toUpperCase() + type.slice(1);
}

export function normalizeMatchStatus(status: Match['status'] | string) {
  return status.toLowerCase() as Lowercase<Match['status']>;
}

export function normalizePaymentStatus(status: Payment['status'] | string) {
  return status.toLowerCase();
}

export function getPaymentTypeBadgeStyle(type: Payment['type']) {
  if (type === 'deposit') {
    return {
      background: 'rgba(16,185,129,0.12)',
      border: '1px solid rgba(16,185,129,0.24)',
      color: ADMIN_COLORS.success,
    };
  }

  if (type === 'withdrawal') {
    return {
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.24)',
      color: ADMIN_COLORS.error,
    };
  }

  if (type === 'prize') {
    return {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.24)',
      color: ADMIN_COLORS.gold,
    };
  }

  return {
    background: 'rgba(124,58,237,0.12)',
    border: '1px solid rgba(124,58,237,0.24)',
    color: ADMIN_COLORS.purple400,
  };
}

export function buildDashboardStats(
  matches: Match[],
  withdrawals: Withdrawal[],
  players: Player[],
  payments: Payment[]
): DashboardStats {
  return {
    totalPlayers: players.length,
    activePlayers: players.filter((player) => !player.banned).length,
    totalMatches: matches.length,
    liveMatches: matches.filter((match) => normalizeMatchStatus(match.status) === 'live').length,
    pendingWithdrawals: withdrawals.filter((withdrawal) => withdrawal.status === 'pending').length,
    totalPayouts: withdrawals
      .filter((withdrawal) => withdrawal.status === 'approved')
      .reduce((total, withdrawal) => total + withdrawal.amount, 0),
    revenue: payments
      .filter((payment) => payment.type === 'entry_fee' && normalizePaymentStatus(payment.status) === 'success')
      .reduce((total, payment) => total + payment.amount, 0),
    payouts: 0,
  };
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
