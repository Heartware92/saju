/**
 * GET /api/admin/users
 *   ?page=1&pageSize=20
 *   &search=email
 *   &gender=male|female|unknown
 *   &ageBucket=twenties|...
 *   &segment=new|active|dormant|vip|paying|free
 *   &sort=joined|lastSeen|totalSpent|analysisCount|orderCount
 *   &order=asc|desc
 *
 * 회원 목록 — 인구통계 + 세그먼트 + LTV + 최근활동 포함.
 * 자세한 집계는 _userAggregates.ts 참고.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';
import { cachedLoadAdminBundle, aggregateUsers, type AggregatedUser } from '../_userAggregates';
import { shouldForce } from '../_cache';
import type { UserSegment, AgeBucketKey } from '@/constants/adminLabels';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type SortKey = 'joined' | 'lastSeen' | 'totalSpent' | 'analysisCount' | 'orderCount';

function compareUsers(a: AggregatedUser, b: AggregatedUser, sort: SortKey, order: 'asc' | 'desc'): number {
  const dir = order === 'asc' ? 1 : -1;
  switch (sort) {
    case 'joined': return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    case 'lastSeen': {
      const at = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
      const bt = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
      return (at - bt) * dir;
    }
    case 'totalSpent':     return (a.totalSpent - b.totalSpent) * dir;
    case 'analysisCount':  return ((a.sajuCount + a.tarotCount) - (b.sajuCount + b.tarotCount)) * dir;
    case 'orderCount':     return (a.orderCount - b.orderCount) * dir;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE))));
  const search = (searchParams.get('search') ?? '').trim().toLowerCase();
  const gender = (searchParams.get('gender') ?? '') as 'male' | 'female' | 'unknown' | '';
  const ageBucket = (searchParams.get('ageBucket') ?? '') as AgeBucketKey | '';
  const segment = (searchParams.get('segment') ?? '') as UserSegment | '';
  const sort = (searchParams.get('sort') ?? 'joined') as SortKey;
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';

  const bundle = await cachedLoadAdminBundle({ force: shouldForce(request) });
  let users = aggregateUsers(bundle);

  if (search) {
    users = users.filter(u => u.email.toLowerCase().includes(search));
  }
  if (gender) {
    users = users.filter(u => u.gender === gender);
  }
  if (ageBucket) {
    users = users.filter(u => u.ageBucket === ageBucket);
  }
  if (segment) {
    users = users.filter(u => u.segments.includes(segment));
  }

  users.sort((a, b) => compareUsers(a, b, sort, order));

  const total = users.length;
  const start = (page - 1) * pageSize;
  const paged = users.slice(start, start + pageSize);

  return NextResponse.json(
    { users: paged, total, page, pageSize, sort, order },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
  );
}
