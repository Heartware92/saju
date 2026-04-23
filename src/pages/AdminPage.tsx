'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { DemographicsSummary, type MemberSummary } from '@/components/admin/members/DemographicsSummary';
import { MembersFilterBar } from '@/components/admin/members/MembersFilterBar';
import { MembersTable, type MemberRow } from '@/components/admin/members/MembersTable';
import { MemberDetailDrawer } from '@/components/admin/members/MemberDetailDrawer';
import { SAJU_CATEGORY_LABEL, TAROT_SPREAD_LABEL, ORDER_STATUS_LABEL, type UserSegment, type AgeBucketKey } from '@/constants/adminLabels';

// ── 타입 ──────────────────────────────────────────────────
interface Stats {
  users: { total: number; today: number; thisMonth: number };
  orders: { completed: number; refunded: number; refundRate: number };
  revenue: { total: number; thisMonth: number; prevMonth: number; refunded: number; growth: number | null };
  usage: { sajuTotal: number; sajuToday: number; tarotTotal: number; tarotToday: number };
  credits: {
    sun: { issued: number; consumed: number; balance: number };
    moon: { issued: number; consumed: number; balance: number };
  };
}

interface Order {
  id: string; user_id: string; userEmail: string; package_name: string; package_id: string;
  amount: number; status: string; payment_method: string; created_at: string; completed_at: string | null;
  sun_credit_amount: number; moon_credit_amount: number;
}

interface UsageRecord {
  id: string; user_id: string; userEmail: string;
  category?: string; spread_type?: string;
  credit_type: string; credit_used: number; created_at: string;
}

type Tab = 'overview' | 'members' | 'orders' | 'records';
type SortKey = 'joined' | 'lastSeen' | 'totalSpent' | 'analysisCount' | 'orderCount';

// ── 유틸 ──────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('ko-KR');
const fmtWon = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-[13px] text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-[22px] font-bold ${color ?? 'text-text-primary'}`}>{value}</p>
      {sub && <p className="text-[13px] text-text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const s = ORDER_STATUS_LABEL[status] ?? { text: status, cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  return <span className={`px-2 py-0.5 text-[12px] rounded-full border ${s.cls}`}>{s.text}</span>;
}

// ── 컴포넌트 ──────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Overview
  const [stats, setStats] = useState<Stats | null>(null);

  // Members
  const [memberSummary, setMemberSummary] = useState<MemberSummary | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberGender, setMemberGender] = useState<'male' | 'female' | 'unknown' | ''>('');
  const [memberAgeBucket, setMemberAgeBucket] = useState<AgeBucketKey | ''>('');
  const [memberSegment, setMemberSegment] = useState<UserSegment | ''>('');
  const [memberSort, setMemberSort] = useState<SortKey>('joined');
  const [memberOrder, setMemberOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderStatus, setOrderStatus] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Records
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [recordPage, setRecordPage] = useState(1);
  const [recordTotal, setRecordTotal] = useState(0);
  const [recordType, setRecordType] = useState<'saju' | 'tarot'>('saju');
  const [recordCategory, setRecordCategory] = useState('');
  const [categorySummary, setCategorySummary] = useState<{ [k: string]: number }>({});

  // 세션 토큰
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  /**
   * 공통 어드민 fetcher — sessionStorage 경유.
   *  - force=true: 캐시 무시 + 서버 캐시도 force=1 로 무효화
   *  - force=false: stale sessionStorage 를 즉시 반영 + 백그라운드 갱신
   */
  const adminFetch = useCallback(async <T,>(path: string, force = false): Promise<T | null> => {
    if (!token) return null;
    const cacheKey = `admin:${path}`;
    const STALE_MS = 30_000;

    // 1) sessionStorage 히트 — fresh 면 즉시 반환, stale 이면 일단 표시하고 백그라운드 재호출
    let staleData: T | null = null;
    if (!force) {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const { data, savedAt } = JSON.parse(raw);
          const age = Date.now() - savedAt;
          if (age <= STALE_MS) return data as T;
          staleData = data as T;
        }
      } catch { /* ignore */ }
    }

    const url = force ? path + (path.includes('?') ? '&' : '?') + 'force=1' : path;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: json, savedAt: Date.now() }));
    } catch { /* storage quota */ }
    // staleData 가 있었다면 이미 UI 에 표시됐을 수 있음 — 어쨌든 최신으로 덮어씀
    return (json ?? staleData) as T;
  }, [token]);

  const fetchStats = useCallback(async (force = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminFetch<Stats>('/api/admin/stats', force);
      if (data) setStats(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, adminFetch]);

  const fetchMemberSummary = useCallback(async (force = false) => {
    if (!token) return;
    try {
      const data = await adminFetch<MemberSummary>('/api/admin/users/summary', force);
      if (data) setMemberSummary(data);
    } catch (e: any) { setError(e.message); }
  }, [token, adminFetch]);

  const fetchMembers = useCallback(async (force = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(memberPage),
        search: memberSearch,
        gender: memberGender,
        ageBucket: memberAgeBucket,
        segment: memberSegment,
        sort: memberSort,
        order: memberOrder,
      });
      const data = await adminFetch<{ users: MemberRow[]; total: number }>(`/api/admin/users?${params}`, force);
      if (data) { setMembers(data.users); setMemberTotal(data.total); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, adminFetch, memberPage, memberSearch, memberGender, memberAgeBucket, memberSegment, memberSort, memberOrder]);

  const fetchOrders = useCallback(async (force = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(orderPage), status: orderStatus, search: orderSearch });
      const data = await adminFetch<{ orders: Order[]; total: number }>(`/api/admin/orders?${params}`, force);
      if (data) { setOrders(data.orders); setOrderTotal(data.total); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, adminFetch, orderPage, orderStatus, orderSearch]);

  const fetchRecords = useCallback(async (force = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(recordPage), type: recordType, category: recordCategory });
      const data = await adminFetch<{ records: UsageRecord[]; total: number; categorySummary: Record<string, number> }>(`/api/admin/records?${params}`, force);
      if (data) { setRecords(data.records); setRecordTotal(data.total); setCategorySummary(data.categorySummary ?? {}); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, adminFetch, recordPage, recordType, recordCategory]);

  // ── 탭 진입 시: 이미 state 에 데이터 있으면 스킵, 없으면 fetch
  useEffect(() => { if (tab === 'overview' && !stats) fetchStats(); }, [tab, stats, fetchStats]);
  useEffect(() => {
    if (tab !== 'members') return;
    if (!memberSummary) fetchMemberSummary();
    if (members.length === 0) fetchMembers();
  }, [tab, memberSummary, members.length, fetchMemberSummary, fetchMembers]);
  useEffect(() => { if (tab === 'orders' && orders.length === 0) fetchOrders(); }, [tab, orders.length, fetchOrders]);
  useEffect(() => { if (tab === 'records' && records.length === 0) fetchRecords(); }, [tab, records.length, fetchRecords]);

  // ── 필터·정렬 변경 시 members 재호출
  const memberFilterKey = `${memberSearch}|${memberGender}|${memberAgeBucket}|${memberSegment}|${memberSort}|${memberOrder}|${memberPage}`;
  const lastMemberFilterKey = useRef<string>('');
  useEffect(() => {
    if (tab !== 'members') return;
    if (lastMemberFilterKey.current === memberFilterKey) return;
    lastMemberFilterKey.current = memberFilterKey;
    fetchMembers();
  }, [tab, memberFilterKey, fetchMembers]);

  // ── orders 필터 변경 시 재호출
  const orderFilterKey = `${orderStatus}|${orderSearch}|${orderPage}`;
  const lastOrderFilterKey = useRef<string>('');
  useEffect(() => {
    if (tab !== 'orders') return;
    if (lastOrderFilterKey.current === orderFilterKey) return;
    lastOrderFilterKey.current = orderFilterKey;
    fetchOrders();
  }, [tab, orderFilterKey, fetchOrders]);

  // ── records 필터 변경 시 재호출
  const recordFilterKey = `${recordType}|${recordCategory}|${recordPage}`;
  const lastRecordFilterKey = useRef<string>('');
  useEffect(() => {
    if (tab !== 'records') return;
    if (lastRecordFilterKey.current === recordFilterKey) return;
    lastRecordFilterKey.current = recordFilterKey;
    fetchRecords();
  }, [tab, recordFilterKey, fetchRecords]);

  // 검색·필터 바뀌면 1페이지로
  useEffect(() => { setMemberPage(1); }, [memberSearch, memberGender, memberAgeBucket, memberSegment, memberSort, memberOrder]);

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center text-text-secondary">
      세션 로딩 중…
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '대시보드' },
    { key: 'members',  label: `회원 관리${memberSummary ? ` (${memberSummary.kpi.totalUsers})` : ''}` },
    { key: 'orders',   label: `주문 (${orderTotal || '…'})` },
    { key: 'records',  label: `이용 기록 (${recordTotal || '…'})` },
  ];

  const refreshCurrentTab = () => {
    setError('');
    if (tab === 'overview') fetchStats(true);
    else if (tab === 'members') { fetchMemberSummary(true); fetchMembers(true); }
    else if (tab === 'orders') fetchOrders(true);
    else fetchRecords(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0614] text-text-primary">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-text-primary">사주 어드민</h1>
          <p className="text-[13px] text-text-tertiary mt-0.5">Admin Dashboard</p>
        </div>
        <button
          onClick={refreshCurrentTab}
          className="text-[14px] text-cta hover:text-cta/80 border border-cta/30 hover:border-cta/60 px-3 py-1.5 rounded-lg transition-all"
        >
          새로고침
        </button>
      </div>

      {/* 탭 */}
      <div className="border-b border-white/10 px-6 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(''); }}
            className={`px-4 py-3 text-[15px] font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? 'border-cta text-cta' : 'border-transparent text-text-tertiary hover:text-text-secondary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 max-w-[1400px] mx-auto">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[15px] text-red-300">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 text-[14px] text-text-tertiary">로딩 중…</div>
        )}

        {/* ── 대시보드 ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">사용자</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="총 사용자" value={fmt(stats.users.total)} />
                <MetricCard label="오늘 신규" value={fmt(stats.users.today)} color="text-cta" />
                <MetricCard label="이번 달 신규" value={fmt(stats.users.thisMonth)} />
                <MetricCard label="총 결제 완료" value={fmt(stats.orders.completed)} sub={`환불 ${stats.orders.refunded}건 (${stats.orders.refundRate}%)`} />
              </div>
            </div>

            <div>
              <h2 className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">매출</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="총 매출" value={fmtWon(stats.revenue.total)} />
                <MetricCard
                  label="이번 달 매출"
                  value={fmtWon(stats.revenue.thisMonth)}
                  sub={stats.revenue.growth !== null ? `전월 대비 ${stats.revenue.growth > 0 ? '+' : ''}${stats.revenue.growth}%` : undefined}
                  color={stats.revenue.growth !== null && stats.revenue.growth > 0 ? 'text-green-300' : undefined}
                />
                <MetricCard label="지난 달 매출" value={fmtWon(stats.revenue.prevMonth)} />
                <MetricCard label="환불 금액" value={fmtWon(stats.revenue.refunded)} color="text-red-300" />
              </div>
            </div>

            <div>
              <h2 className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">서비스 이용</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="사주 분석 (누적)" value={fmt(stats.usage.sajuTotal)} />
                <MetricCard label="사주 분석 (오늘)" value={fmt(stats.usage.sajuToday)} color="text-cta" />
                <MetricCard label="타로 분석 (누적)" value={fmt(stats.usage.tarotTotal)} />
                <MetricCard label="타로 분석 (오늘)" value={fmt(stats.usage.tarotToday)} color="text-cta" />
              </div>
            </div>

            <div>
              <h2 className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">크레딧 현황</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard label="☀️ 해 발행" value={fmt(stats.credits.sun.issued)} sub={`소비 ${fmt(stats.credits.sun.consumed)} / 잔여 ${fmt(stats.credits.sun.balance)}`} />
                <MetricCard label="🌙 달 발행" value={fmt(stats.credits.moon.issued)} sub={`소비 ${fmt(stats.credits.moon.consumed)} / 잔여 ${fmt(stats.credits.moon.balance)}`} />
                <MetricCard
                  label="크레딧 소비율"
                  value={stats.credits.sun.issued > 0 ? `☀️ ${Math.round(stats.credits.sun.consumed / stats.credits.sun.issued * 100)}%` : '-'}
                  sub={stats.credits.moon.issued > 0 ? `🌙 ${Math.round(stats.credits.moon.consumed / stats.credits.moon.issued * 100)}%` : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 회원 관리 ── */}
        {tab === 'members' && (
          <div className="space-y-6">
            <DemographicsSummary
              summary={memberSummary}
              activeSegment={memberSegment}
              onSegmentChange={setMemberSegment}
            />

            <div className="space-y-3">
              <MembersFilterBar
                search={memberSearch} onSearchChange={setMemberSearch}
                gender={memberGender} onGenderChange={setMemberGender}
                ageBucket={memberAgeBucket} onAgeBucketChange={setMemberAgeBucket}
                totalCount={memberTotal}
              />
              <MembersTable
                rows={members}
                loading={loading}
                sort={memberSort}
                order={memberOrder}
                onSortChange={(s, o) => { setMemberSort(s); setMemberOrder(o); }}
                onRowClick={setSelectedUserId}
              />
              <Pagination page={memberPage} total={memberTotal} pageSize={20} onChange={setMemberPage} />
            </div>
          </div>
        )}

        {/* ── 주문 ── */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="이메일 / 주문 ID 검색"
                value={orderSearch}
                onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }}
                className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cta/50"
              />
              <select
                value={orderStatus}
                onChange={e => { setOrderStatus(e.target.value); setOrderPage(1); }}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-[15px] text-text-primary focus:outline-none focus:border-cta/50"
              >
                <option value="">전체 상태</option>
                <option value="completed">완료</option>
                <option value="pending">대기</option>
                <option value="refunded">환불</option>
                <option value="failed">실패</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {['상태', '사용자', '패키지', '결제금액', '해 크레딧', '달 크레딧', '결제수단', '결제일시'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[12px] text-text-tertiary uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-3 py-2.5"><Badge status={o.status} /></td>
                      <td className="px-3 py-2.5 text-text-secondary max-w-[180px] truncate">{o.userEmail}</td>
                      <td className="px-3 py-2.5 text-text-primary">{o.package_name}</td>
                      <td className="px-3 py-2.5 text-text-primary font-medium">{fmtWon(o.amount)}</td>
                      <td className="px-3 py-2.5 text-amber-300">☀️ {o.sun_credit_amount}</td>
                      <td className="px-3 py-2.5 text-indigo-300">🌙 {o.moon_credit_amount}</td>
                      <td className="px-3 py-2.5 text-text-tertiary">{o.payment_method ?? '-'}</td>
                      <td className="px-3 py-2.5 text-text-tertiary">{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && !loading && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-text-tertiary">데이터 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={orderPage} total={orderTotal} pageSize={20} onChange={setOrderPage} />
          </div>
        )}

        {/* ── 이용 기록 ── */}
        {tab === 'records' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                {(['saju', 'tarot'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setRecordType(t); setRecordCategory(''); setRecordPage(1); }}
                    className={`px-3 py-1.5 rounded text-[14px] font-medium transition-colors ${recordType === t ? 'bg-cta text-white' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    {t === 'saju' ? '사주 분석' : '타로 분석'}
                  </button>
                ))}
              </div>

              {Object.keys(categorySummary).length > 0 && (
                <select
                  value={recordCategory}
                  onChange={e => { setRecordCategory(e.target.value); setRecordPage(1); }}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-[15px] text-text-primary focus:outline-none focus:border-cta/50"
                >
                  <option value="">전체 카테고리</option>
                  {Object.entries(categorySummary).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, cnt]) => (
                    <option key={cat} value={cat}>
                      {(recordType === 'tarot' ? TAROT_SPREAD_LABEL[cat] : SAJU_CATEGORY_LABEL[cat]) ?? cat} ({fmt(cnt as number)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 카테고리 분포 */}
            {Object.keys(categorySummary).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(categorySummary).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, cnt]) => {
                  const total = Object.values(categorySummary).reduce((s: number, v) => s + (v as number), 0);
                  const label = (recordType === 'tarot' ? TAROT_SPREAD_LABEL[cat] : SAJU_CATEGORY_LABEL[cat]) ?? cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setRecordCategory(recordCategory === cat ? '' : cat); setRecordPage(1); }}
                      className={`px-2.5 py-1 rounded-full text-[13px] border transition-all ${recordCategory === cat ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {label} <span className="text-text-tertiary">{Math.round((cnt as number) / total * 100)}%</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {['사용자', '서비스', '크레딧 타입', '소비량', '일시'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[12px] text-text-tertiary uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-3 py-2.5 text-text-secondary max-w-[200px] truncate">{r.userEmail}</td>
                      <td className="px-3 py-2.5 text-text-primary">
                        {SAJU_CATEGORY_LABEL[r.category ?? ''] ?? TAROT_SPREAD_LABEL[r.spread_type ?? ''] ?? (r.category ?? r.spread_type ?? '-')}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.credit_type === 'sun'
                          ? <span className="text-amber-300">☀️ 해</span>
                          : <span className="text-indigo-300">🌙 달</span>}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">{r.credit_used}</td>
                      <td className="px-3 py-2.5 text-text-tertiary">{fmtDate(r.created_at)}</td>
                    </tr>
                  ))}
                  {records.length === 0 && !loading && (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-text-tertiary">데이터 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={recordPage} total={recordTotal} pageSize={30} onChange={setRecordPage} />
          </div>
        )}
      </div>

      {/* ── 회원 상세 Drawer ── */}
      {selectedUserId && (
        <MemberDetailDrawer
          userId={selectedUserId}
          token={token}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center pt-2">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-[14px] bg-white/5 border border-white/10 text-text-secondary disabled:opacity-30 hover:border-white/20 transition-colors">이전</button>
      <span className="text-[14px] text-text-tertiary">{page} / {totalPages} (총 {total.toLocaleString()}건)</span>
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-[14px] bg-white/5 border border-white/10 text-text-secondary disabled:opacity-30 hover:border-white/20 transition-colors">다음</button>
    </div>
  );
}
