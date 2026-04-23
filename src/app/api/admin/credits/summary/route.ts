/**
 * GET /api/admin/credits/summary
 * 크레딧 흐름: reason별 소비, 발행-소비-잔여 폭포, 미소비 부채, 월별 흐름
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../../_auth';
import { cached, shouldForce } from '../../_cache';

const CACHE_KEY = 'admin:credits:summary:v1';
const TTL_SECONDS = 30;
const KST_OFFSET_MIN = 540;

function monthKey(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + KST_OFFSET_MIN * 60_000);
  return kst.toISOString().slice(0, 7);
}

function lastNMonths(n: number): string[] {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MIN * 60_000);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(kstNow);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

async function computeSummary() {
  const [creditsRes, txnRes] = await Promise.all([
    supabaseAdmin.from('user_credits').select('user_id, sun_balance, moon_balance, total_sun_purchased, total_moon_purchased, total_sun_consumed, total_moon_consumed, updated_at'),
    supabaseAdmin.from('credit_transactions').select('credit_type, type, amount, reason, created_at, order_id'),
  ]);

  const credits = creditsRes.data ?? [];
  const txns = txnRes.data ?? [];

  const sunIssued = credits.reduce((s, c) => s + (c.total_sun_purchased ?? 0), 0);
  const moonIssued = credits.reduce((s, c) => s + (c.total_moon_purchased ?? 0), 0);
  const sunConsumed = credits.reduce((s, c) => s + (c.total_sun_consumed ?? 0), 0);
  const moonConsumed = credits.reduce((s, c) => s + (c.total_moon_consumed ?? 0), 0);
  const sunBalance = credits.reduce((s, c) => s + (c.sun_balance ?? 0), 0);
  const moonBalance = credits.reduce((s, c) => s + (c.moon_balance ?? 0), 0);

  // ── reason별 소비 분포 (consume 타입만) ──
  const reasonMap = new Map<string, { sun: number; moon: number }>();
  for (const t of txns) {
    if (t.type !== 'consume') continue;
    const key = t.reason ?? '(미상)';
    const entry = reasonMap.get(key) ?? { sun: 0, moon: 0 };
    if (t.credit_type === 'sun') entry.sun += Math.abs(t.amount ?? 0);
    else if (t.credit_type === 'moon') entry.moon += Math.abs(t.amount ?? 0);
    reasonMap.set(key, entry);
  }
  const reasonBreakdown = [...reasonMap.entries()]
    .map(([reason, v]) => ({ reason, sun: v.sun, moon: v.moon, total: v.sun + v.moon }))
    .sort((a, b) => b.total - a.total);

  // ── 월별 흐름 (12개월) ──
  const months = lastNMonths(12);
  const mi = new Map(months.map((m, i) => [m, i]));
  const sunIssuedMo = new Array(12).fill(0);
  const sunConsumedMo = new Array(12).fill(0);
  const moonIssuedMo = new Array(12).fill(0);
  const moonConsumedMo = new Array(12).fill(0);
  for (const t of txns) {
    const idx = mi.get(monthKey(t.created_at));
    if (idx === undefined) continue;
    const abs = Math.abs(t.amount ?? 0);
    if (t.credit_type === 'sun') {
      if (t.type === 'purchase' || t.type === 'signup_bonus' || t.type === 'admin_adjust') sunIssuedMo[idx] += (t.amount ?? 0) > 0 ? abs : 0;
      else if (t.type === 'consume') sunConsumedMo[idx] += abs;
    } else if (t.credit_type === 'moon') {
      if (t.type === 'purchase' || t.type === 'signup_bonus' || t.type === 'admin_adjust') moonIssuedMo[idx] += (t.amount ?? 0) > 0 ? abs : 0;
      else if (t.type === 'consume') moonConsumedMo[idx] += abs;
    }
  }
  const monthly = months.map((m, i) => ({
    month: m,
    sunIssued: sunIssuedMo[i],
    sunConsumed: sunConsumedMo[i],
    moonIssued: moonIssuedMo[i],
    moonConsumed: moonConsumedMo[i],
    netSun: sunIssuedMo[i] - sunConsumedMo[i],
    netMoon: moonIssuedMo[i] - moonConsumedMo[i],
  }));

  // ── 크레딧 부채 (미소비 잔량) ──
  // 추정 단가 (원가) — 해 3000원, 달 300원 (현재 패키지 평균 기준, 튜닝 가능)
  const ESTIMATED_SUN_COST_WON = 3_000;
  const ESTIMATED_MOON_COST_WON = 300;
  const debtWon = sunBalance * ESTIMATED_SUN_COST_WON + moonBalance * ESTIMATED_MOON_COST_WON;

  // ── 소진율 ──
  const sunConsumeRate = sunIssued > 0 ? Math.round((sunConsumed / sunIssued) * 100) : 0;
  const moonConsumeRate = moonIssued > 0 ? Math.round((moonConsumed / moonIssued) * 100) : 0;

  // ── 활성 회원 (잔량 > 0) ──
  const withSun = credits.filter(c => (c.sun_balance ?? 0) > 0).length;
  const withMoon = credits.filter(c => (c.moon_balance ?? 0) > 0).length;
  const withAny = credits.filter(c => (c.sun_balance ?? 0) > 0 || (c.moon_balance ?? 0) > 0).length;

  // ── transaction type 집계 ──
  const typeMap = new Map<string, number>();
  for (const t of txns) {
    typeMap.set(t.type, (typeMap.get(t.type) ?? 0) + 1);
  }
  const txnTypes = [...typeMap.entries()].map(([type, count]) => ({ type, count }));

  return {
    kpi: {
      sunIssued, sunConsumed, sunBalance,
      moonIssued, moonConsumed, moonBalance,
      sunConsumeRate, moonConsumeRate,
      debtWon,
      withSun, withMoon, withAny,
      txnCount: txns.length,
    },
    reasonBreakdown,
    monthly,
    txnTypes,
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
