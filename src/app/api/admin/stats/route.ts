/**
 * GET /api/admin/stats
 * 어드민 대시보드 핵심 지표
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../_auth';
import { cached, shouldForce } from '../_cache';

const STATS_CACHE_KEY = 'admin:stats:v1';
const STATS_TTL_SECONDS = 30;

async function computeStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    usersRes,
    todayUsersRes,
    monthUsersRes,
    ordersRes,
    monthRevenueRes,
    prevMonthRevenueRes,
    sajuRes,
    todaySajuRes,
    tarotRes,
    todayTarotRes,
    creditsRes,
  ] = await Promise.all([
    // 총 사용자 수
    supabaseAdmin.from('birth_profiles').select('user_id', { count: 'exact', head: true }).eq('is_primary', true),
    // 오늘 신규 가입 (크레딧 레코드 생성 시점 기준)
    supabaseAdmin.from('user_credits').select('user_id', { count: 'exact', head: true }).gte('created_at', todayStart),
    // 이번 달 신규 가입
    supabaseAdmin.from('user_credits').select('user_id', { count: 'exact', head: true }).gte('created_at', monthStart),
    // 전체 주문 (status별)
    supabaseAdmin.from('orders').select('status, amount').not('status', 'eq', 'pending'),
    // 이번 달 매출
    supabaseAdmin.from('orders').select('amount').eq('status', 'completed').gte('created_at', monthStart),
    // 지난 달 매출
    supabaseAdmin.from('orders').select('amount').eq('status', 'completed').gte('created_at', prevMonthStart).lt('created_at', monthStart),
    // 총 사주 분석 수
    supabaseAdmin.from('saju_records').select('id', { count: 'exact', head: true }),
    // 오늘 사주 분석 수
    supabaseAdmin.from('saju_records').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    // 총 타로 분석 수
    supabaseAdmin.from('tarot_records').select('id', { count: 'exact', head: true }),
    // 오늘 타로 분석 수
    supabaseAdmin.from('tarot_records').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    // 크레딧 총량 (발행 vs 소비)
    supabaseAdmin.from('user_credits').select('total_sun_purchased, total_moon_purchased, total_sun_consumed, total_moon_consumed, sun_balance, moon_balance'),
  ]);

  // 주문 통계 집계
  const orders = ordersRes.data ?? [];
  const completedOrders = orders.filter(o => o.status === 'completed');
  const refundedOrders = orders.filter(o => o.status === 'refunded');
  const totalRevenue = completedOrders.reduce((s, o) => s + (o.amount ?? 0), 0);
  const thisMonthRevenue = (monthRevenueRes.data ?? []).reduce((s, o) => s + (o.amount ?? 0), 0);
  const prevMonthRevenue = (prevMonthRevenueRes.data ?? []).reduce((s, o) => s + (o.amount ?? 0), 0);
  const refundedRevenue = refundedOrders.reduce((s, o) => s + (o.amount ?? 0), 0);

  // 크레딧 집계
  const credits = creditsRes.data ?? [];
  const totalSunIssued = credits.reduce((s, c) => s + (c.total_sun_purchased ?? 0), 0);
  const totalMoonIssued = credits.reduce((s, c) => s + (c.total_moon_purchased ?? 0), 0);
  const totalSunConsumed = credits.reduce((s, c) => s + (c.total_sun_consumed ?? 0), 0);
  const totalMoonConsumed = credits.reduce((s, c) => s + (c.total_moon_consumed ?? 0), 0);
  const totalSunBalance = credits.reduce((s, c) => s + (c.sun_balance ?? 0), 0);
  const totalMoonBalance = credits.reduce((s, c) => s + (c.moon_balance ?? 0), 0);

  return {
    users: {
      total: usersRes.count ?? 0,
      today: todayUsersRes.count ?? 0,
      thisMonth: monthUsersRes.count ?? 0,
    },
    orders: {
      completed: completedOrders.length,
      refunded: refundedOrders.length,
      refundRate: completedOrders.length > 0
        ? Math.round((refundedOrders.length / (completedOrders.length + refundedOrders.length)) * 100)
        : 0,
    },
    revenue: {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      prevMonth: prevMonthRevenue,
      refunded: refundedRevenue,
      growth: prevMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : null,
    },
    usage: {
      sajuTotal: sajuRes.count ?? 0,
      sajuToday: todaySajuRes.count ?? 0,
      tarotTotal: tarotRes.count ?? 0,
      tarotToday: todayTarotRes.count ?? 0,
    },
    credits: {
      sun: { issued: totalSunIssued, consumed: totalSunConsumed, balance: totalSunBalance },
      moon: { issued: totalMoonIssued, consumed: totalMoonConsumed, balance: totalMoonBalance },
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const stats = await cached(STATS_CACHE_KEY, computeStats, {
    ttl: STATS_TTL_SECONDS,
    force: shouldForce(request),
  });

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
  });
}
