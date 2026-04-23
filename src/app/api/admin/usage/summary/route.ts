/**
 * GET /api/admin/usage/summary
 * 이용 분석: 카테고리 랭킹, 30일 추이, 시간×요일 히트맵, 해/달 소비 비중
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../../_auth';
import { cached, shouldForce } from '../../_cache';

const CACHE_KEY = 'admin:usage:summary:v1';
const TTL_SECONDS = 30;

const KST_OFFSET_MIN = 540;

function toKst(iso: string) {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MIN * 60_000);
}

function dayKey(iso: string): string {
  return toKst(iso).toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MIN * 60_000);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(kstNow);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

async function computeSummary() {
  const thirty = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [sajuRes, tarotRes, creditRes] = await Promise.all([
    supabaseAdmin.from('saju_records').select('user_id, category, credit_used, credit_type, created_at'),
    supabaseAdmin.from('tarot_records').select('user_id, spread_type, credit_used, credit_type, created_at'),
    supabaseAdmin.from('credit_transactions').select('credit_type, amount, reason, type, created_at').eq('type', 'consume'),
  ]);

  const saju = sajuRes.data ?? [];
  const tarot = tarotRes.data ?? [];
  const creditConsumed = creditRes.data ?? [];

  // ── 카테고리 랭킹 (사주 18종 + 타로 5종) ──
  const sajuRank = new Map<string, { count: number; uniqueUsers: Set<string> }>();
  for (const r of saju) {
    const key = r.category ?? '(미상)';
    const entry = sajuRank.get(key) ?? { count: 0, uniqueUsers: new Set() };
    entry.count++;
    entry.uniqueUsers.add(r.user_id);
    sajuRank.set(key, entry);
  }
  const sajuRanking = [...sajuRank.entries()]
    .map(([category, v]) => ({ category, count: v.count, uniqueUsers: v.uniqueUsers.size }))
    .sort((a, b) => b.count - a.count);

  const tarotRank = new Map<string, { count: number; uniqueUsers: Set<string> }>();
  for (const r of tarot) {
    const key = r.spread_type ?? '(미상)';
    const entry = tarotRank.get(key) ?? { count: 0, uniqueUsers: new Set() };
    entry.count++;
    entry.uniqueUsers.add(r.user_id);
    tarotRank.set(key, entry);
  }
  const tarotRanking = [...tarotRank.entries()]
    .map(([spread, v]) => ({ spread, count: v.count, uniqueUsers: v.uniqueUsers.size }))
    .sort((a, b) => b.count - a.count);

  // ── 30일 추이 (사주+타로 합산 일별) ──
  const days = lastNDays(30);
  const dayIndex = new Map(days.map((d, i) => [d, i]));
  const dailySaju = new Array(30).fill(0);
  const dailyTarot = new Array(30).fill(0);

  for (const r of saju) {
    if (!r.created_at || r.created_at < thirty) continue;
    const idx = dayIndex.get(dayKey(r.created_at));
    if (idx !== undefined) dailySaju[idx]++;
  }
  for (const r of tarot) {
    if (!r.created_at || r.created_at < thirty) continue;
    const idx = dayIndex.get(dayKey(r.created_at));
    if (idx !== undefined) dailyTarot[idx]++;
  }
  const daily = days.map((d, i) => ({
    date: d,
    saju: dailySaju[i],
    tarot: dailyTarot[i],
    total: dailySaju[i] + dailyTarot[i],
  }));

  // ── 시간대×요일 히트맵 (7일 × 24시, KST) ──
  // weekday: 0=일 .. 6=토, hour: 0..23
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const r of [...saju, ...tarot]) {
    if (!r.created_at) continue;
    const kst = toKst(r.created_at);
    const weekday = kst.getUTCDay();
    const hour = kst.getUTCHours();
    heatmap[weekday][hour]++;
  }

  // ── 해/달 소비 비중 ──
  let sunConsumed = 0, moonConsumed = 0;
  for (const r of saju) {
    if (r.credit_type === 'sun') sunConsumed += r.credit_used ?? 0;
    else if (r.credit_type === 'moon') moonConsumed += r.credit_used ?? 0;
  }
  for (const r of tarot) {
    if (r.credit_type === 'sun') sunConsumed += r.credit_used ?? 0;
    else if (r.credit_type === 'moon') moonConsumed += r.credit_used ?? 0;
  }
  // credit_transactions 기반 재검증 값도 함께 제공
  let sunTxn = 0, moonTxn = 0;
  for (const t of creditConsumed) {
    if (t.credit_type === 'sun') sunTxn += Math.abs(t.amount ?? 0);
    else if (t.credit_type === 'moon') moonTxn += Math.abs(t.amount ?? 0);
  }

  return {
    kpi: {
      sajuTotal: saju.length,
      tarotTotal: tarot.length,
      grandTotal: saju.length + tarot.length,
      uniqueSajuUsers: new Set(saju.map(r => r.user_id)).size,
      uniqueTarotUsers: new Set(tarot.map(r => r.user_id)).size,
    },
    sajuRanking,
    tarotRanking,
    daily,
    heatmap,
    credit: {
      sunConsumed,
      moonConsumed,
      sunTxn,
      moonTxn,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const data = await cached(CACHE_KEY, computeSummary, {
    ttl: TTL_SECONDS,
    force: shouldForce(request),
  });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
  });
}
