// lib/referral-api.ts

import api from '@/lib/api';
import type {
  CreateReferralPayload,
  MarkPaidPayload,
  QrResponse,
  ReferralDetailResponse,
  ReferralListResponse,
  UpdateReferralPayload,
} from '@/types/referral';

export async function fetchAllReferrals(page = 1, limit = 100): Promise<ReferralListResponse> {
  const { data } = await api.get<ReferralListResponse>(`/proxy/referral?page=${page}&limit=${limit}`);
  return data;
}

export async function fetchReferralDetail(id: string): Promise<ReferralDetailResponse> {
  const { data } = await api.get<ReferralDetailResponse>(`/proxy/referral/${id}`);
  return data;
}

export async function createReferral(payload: CreateReferralPayload): Promise<{ message: string; referral: unknown }> {
  const { data } = await api.post<{ message: string; referral: unknown }>('/proxy/referral', payload);
  return data;
}

export async function updateReferral(id: string, payload: UpdateReferralPayload): Promise<{ message: string; referral: unknown }> {
  const { data } = await api.patch<{ message: string; referral: unknown }>(`/proxy/referral/${id}`, payload);
  return data;
}

export async function toggleReferral(id: string): Promise<{ message: string; referral: unknown }> {
  const { data } = await api.patch<{ message: string; referral: unknown }>(`/proxy/referral/${id}/toggle`);
  return data;
}

export async function markPaid(id: string, payload: MarkPaidPayload): Promise<{ message: string; payout: unknown }> {
  const { data } = await api.post<{ message: string; payout: unknown }>(`/proxy/referral/${id}/mark-paid`, payload);
  return data;
}

export async function fetchQrCode(id: string): Promise<QrResponse> {
  const { data } = await api.get<QrResponse>(`/proxy/referral/${id}/qr`);
  return data;
}

export function getExportUrl(id: string): string {
  return `/api/proxy/referral/${id}/export`;
}
