// types/index.ts
export type MatchStatus =
  | 'upcoming'
  | 'ready'
  | 'live'
  | 'completed'
  | 'cancelled'
  | 'UPCOMING'
  | 'READY'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Match {
  _id: string;
  title: string;
  game: string;
  status: MatchStatus;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  playersCount: number;
  startTime: string;
  createdAt: string;
  paymentStatus?: 'NOT_APPLICABLE' | 'PENDING' | 'PAID';
  declaredWinnerId?: { _id: string; username: string } | string | null;
  winnerUpiId?: string | null;
  prizeAmount?: number;
  prizeBreakdown?: { playerPrize: number; managerCut: number; adminCut: number; teamSize: number; prizePerMember: number };
  map?: string;
  mode?: string;
  players?: { _id: string; username: string }[];
}

export interface Withdrawal {
  _id: string;
  userId: { _id: string; username: string; email: string };
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  upiId: string;
  requestedAt: string;
  processedAt?: string;
}

export interface Player {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  wallet: number;
  totalWinnings: number;
  matchesPlayed: number;
  banned: boolean;
  role: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  userId: { _id: string; username: string };
  type: 'deposit' | 'withdrawal' | 'prize' | 'entry_fee';
  amount: number;
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  totalMatches: number;
  liveMatches: number;
  pendingWithdrawals: number;
  totalPayouts: number;
  revenue: number;
  payouts: number;
}
