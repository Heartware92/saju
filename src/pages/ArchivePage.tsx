'use client';

/**
 * 보관함 — 이전에 본 풀이 기록 리스트.
 *
 * 클릭 시 원래 결과 페이지로 `?recordId=<id>` 쿼리와 함께 이동한다.
 * 결과 페이지 각각이 recordId 를 감지해 AI 호출·크레딧 차감 없이
 * 저장된 interpretation 을 그대로 렌더 (보관함 재생 모드).
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '../components/ui/Card';
import { sajuDB, tarotDB } from '../services/supabase';
import { useUserStore } from '../store/useUserStore';
import { SAJU_CATEGORY_LABEL, TAROT_SPREAD_LABEL } from '../constants/adminLabels';
import type { SajuRecord, TarotRecord } from '../types/credit';

type TabType = 'saju' | 'tarot';

// ── 카테고리별 아이콘·색 — 카드를 한눈에 구분 ─────────────────────────
const SAJU_CATEGORY_ICON: Record<string, string> = {
  traditional: '📜', newyear: '🌅', today: '☀️', date: '📆',
  gunghap: '❤️', taekil: '🗓️', tojeong: '📖', zamidusu: '🌌',
  love: '💕', wealth: '💰', career: '💼', health: '🌿',
  study: '✏️', people: '✨', children: '👶', personality: '🎭',
  name: '📝', dream: '🌙', basic: '📃', hybrid: '🔮',
  period: '📆', relation: '🤝',
};

const SAJU_CATEGORY_COLOR: Record<string, string> = {
  // 큰 8 — 비비드 톤
  traditional: '#fbbf24', newyear: '#fb923c', today: '#facc15', date: '#a3e635',
  gunghap: '#f472b6', taekil: '#60a5fa', tojeong: '#a78bfa', zamidusu: '#c084fc',
  // 더많은운세 — 차분 톤
  love: '#f9a8d4', wealth: '#fcd34d', career: '#7dd3fc', health: '#86efac',
  study: '#fde047', people: '#e9d5ff', children: '#fbcfe8', personality: '#fdba74',
  name: '#bef264', dream: '#c4b5fd',
  basic: '#94a3b8', hybrid: '#a78bfa', period: '#a3e635', relation: '#94a3b8',
};

const TAROT_SPREAD_ICON: Record<string, string> = {
  oneCard: '🃏', threeCard: '🎴', celticCross: '✦', love: '💖', hybrid: '🔮',
  today: '☀️', monthly: '🌙', single: '🃏', 'monthly-3card': '🎴',
  'hybrid-saju': '🔮',
};

/** YYYY-MM-DD HH:mm 형식 */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

/** 생년월일·시간 짧게 — "1992.09.14 13:22" */
function formatBirth(birthDate: string, birthTime?: string | null): string {
  const dot = (birthDate || '').replace(/-/g, '.');
  return birthTime ? `${dot} ${birthTime}` : dot;
}

const GENDER_LABEL: Record<string, string> = { male: '남', female: '여' };
const CALENDAR_LABEL: Record<string, string> = { solar: '양력', lunar: '음력' };

/**
 * 풀이 본문에서 사용자에게 보여줄 첫 줄(은유 제목) 추출.
 * `[general]`·`[today_energy]` 같은 개발자용 섹션 마커는 건너뛰고 실제 본문 첫 줄을 찾는다.
 */
function extractTitle(record: SajuRecord): string {
  const body = record.interpretation_detailed || record.interpretation_basic || '';
  const lines = body.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  // 섹션 키 패턴: [영문/숫자/언더스코어]만 있는 줄. 한글 본문은 안 걸림.
  const SECTION_MARKER_RE = /^\[[\w-]+\]$/;
  const firstReal = lines.find((l) => !SECTION_MARKER_RE.test(l)) ?? '';
  return firstReal.length > 40 ? firstReal.slice(0, 40) + '…' : firstReal;
}

/** 사주 카테고리 → 결과 페이지 URL. recordId 를 쿼리로 붙인다. */
function getSajuRoute(record: SajuRecord): string {
  const cat = record.category;
  const moreCategories = [
    'love', 'wealth', 'career', 'health', 'study', 'people',
    'children', 'personality', 'name', 'dream',
  ];
  if (moreCategories.includes(cat)) {
    return `/saju/more/${cat}?recordId=${record.id}`;
  }
  const map: Record<string, string> = {
    traditional: '/saju/result',
    today: '/saju/today',
    newyear: '/saju/newyear',
    taekil: '/saju/taekil',
    tojeong: '/saju/tojeong',
    zamidusu: '/saju/zamidusu',
    gunghap: '/saju/gunghap',
    date: '/saju/date',
    period: '/saju/date',
    basic: '/saju/result',
  };
  const base = map[cat] ?? '/archive';
  return `${base}?recordId=${record.id}`;
}

/** 타로 레코드 → 결과 페이지 URL. spread_type 에 따라 분기. */
function getTarotRoute(record: TarotRecord): string {
  // 타로 페이지는 /tarot 로 통일. 재생 모드는 recordId 쿼리로 감지.
  return `/tarot?recordId=${record.id}`;
}

export default function ArchivePage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('saju');
  const [sajuRecords, setSajuRecords] = useState<SajuRecord[]>([]);
  const [tarotRecords, setTarotRecords] = useState<TarotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 삭제 확인 모달 — undo 안전망 없는 삭제는 무조건 confirm 한 번 받는다
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'saju'; id: string; label: string }
    | { kind: 'tarot'; id: string; label: string }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'saju') {
        const ok = await sajuDB.deleteRecord(pendingDelete.id);
        if (ok) setSajuRecords((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      } else {
        const ok = await tarotDB.deleteRecord(pendingDelete.id);
        if (ok) setTarotRecords((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      }
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    Promise.all([
      sajuDB.getRecords(user.id, 100),
      tarotDB.getRecords(user.id, 100),
    ])
      .then(([saju, tarot]) => {
        setSajuRecords(saju);
        setTarotRecords(tarot);
      })
      .catch((e) => {
        console.error('[archive] fetch failed', e);
        setError('기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const sajuSorted = useMemo(() => sajuRecords, [sajuRecords]);

  if (!user) {
    return (
      <div className="min-h-screen bg-space-deep px-4 pt-6 pb-4 flex flex-col items-center justify-center text-center">
        <p className="text-text-secondary mb-4">보관함은 로그인 후 이용할 수 있어요.</p>
        <Link href="/login?from=/archive" className="text-cta font-semibold underline">로그인하기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-deep px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">보관함</h1>
        <p className="text-sm text-text-secondary mt-1">이전에 본 풀이를 그대로 다시 볼 수 있어요</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('saju')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'saju'
              ? 'bg-cta text-white shadow-lg shadow-cta/20'
              : 'bg-space-surface text-text-secondary'
          }`}
        >
          사주 기록 {sajuRecords.length > 0 && <span className="ml-1 opacity-80">({sajuRecords.length})</span>}
        </button>
        <button
          onClick={() => setActiveTab('tarot')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'tarot'
              ? 'bg-cta text-white shadow-lg shadow-cta/20'
              : 'bg-space-surface text-text-secondary'
          }`}
        >
          타로 기록 {tarotRecords.length > 0 && <span className="ml-1 opacity-80">({tarotRecords.length})</span>}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-text-tertiary text-sm">불러오는 중…</div>
      )}
      {error && !loading && (
        <div className="text-center py-8 text-text-secondary text-sm">{error}</div>
      )}

      {!loading && !error && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'saju' && (
            <div className="space-y-3">
              {sajuSorted.length > 0 ? (
                sajuSorted.map((record) => {
                  const categoryLabel = SAJU_CATEGORY_LABEL[record.category] ?? record.category;
                  const icon = SAJU_CATEGORY_ICON[record.category] ?? '📖';
                  const color = SAJU_CATEGORY_COLOR[record.category] ?? '#94a3b8';
                  return (
                    <div key={record.id} className="relative">
                      <Link href={getSajuRoute(record)} className="block">
                        <Card padding="md" hover>
                          <div className="flex items-center gap-3">
                            {/* 카테고리 아이콘 박스 — 색·아이콘으로 한눈에 구분 */}
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: `${color}1f`, border: `1px solid ${color}55` }}
                              aria-hidden="true"
                            >
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className="text-sm font-bold truncate"
                                  style={{ color }}
                                >
                                  {categoryLabel}
                                </h3>
                                {record.is_detailed && (
                                  <span className="text-[10px] text-cta border border-cta/40 px-1.5 py-[1px] rounded flex-shrink-0">상세</span>
                                )}
                              </div>
                              {/* 본문 첫 줄 — 섹션 마커는 extractTitle 이 걸러줌 */}
                              <p className="text-[12px] text-text-secondary truncate mb-1">
                                {extractTitle(record) || '풀이 다시 보기'}
                              </p>
                              {/* 누구의 사주인지 — 생일 + 성별 + 음/양력 (프로필명은 2단계에서 추가) */}
                              <p className="text-[11px] text-text-tertiary truncate">
                                {formatBirth(record.birth_date, record.birth_time)}
                                {record.gender && ` · ${GENDER_LABEL[record.gender] ?? record.gender}`}
                                {record.calendar_type && ` · ${CALENDAR_LABEL[record.calendar_type] ?? record.calendar_type}`}
                              </p>
                            </div>
                            <span className="text-[10px] text-text-tertiary flex-shrink-0 self-start mt-1 mr-7">
                              {formatDate(record.created_at)}
                            </span>
                          </div>
                        </Card>
                      </Link>
                      {/* 삭제 버튼 — Link 외부 absolute 로 배치해서 카드 클릭 충돌 방지 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingDelete({ kind: 'saju', id: record.id, label: categoryLabel });
                        }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={`${categoryLabel} 기록 삭제`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              ) : (
                <EmptyState type="saju" />
              )}
            </div>
          )}

          {activeTab === 'tarot' && (
            <div className="space-y-3">
              {tarotRecords.length > 0 ? (
                tarotRecords.map((record) => {
                  const spreadLabel = TAROT_SPREAD_LABEL[record.spread_type] ?? record.spread_type;
                  const icon = TAROT_SPREAD_ICON[record.spread_type] ?? '🎴';
                  return (
                    <div key={record.id} className="relative">
                      <Link href={getTarotRoute(record)} className="block">
                        <Card padding="md" hover>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[rgba(165,180,252,0.12)] border border-[rgba(165,180,252,0.35)] flex items-center justify-center text-lg flex-shrink-0">
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-[#a5b4fc] truncate mb-1">
                                {spreadLabel}
                              </h3>
                              <p className="text-[12px] text-text-secondary truncate">
                                {record.question || '질문 없음'}
                              </p>
                            </div>
                            <span className="text-[10px] text-text-tertiary flex-shrink-0 self-start mt-1 mr-7">
                              {formatDate(record.created_at)}
                            </span>
                          </div>
                        </Card>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPendingDelete({ kind: 'tarot', id: record.id, label: spreadLabel });
                        }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={`${spreadLabel} 기록 삭제`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              ) : (
                <EmptyState type="tarot" />
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 삭제 확인 모달 — 비가역 작업이라 confirm 한 번 받음 */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-space-surface border border-[var(--border-subtle)] p-5"
          >
            <h3 className="text-base font-bold text-text-primary mb-2">기록을 삭제하시겠어요?</h3>
            <p className="text-sm text-text-secondary mb-1">
              <span className="font-semibold text-text-primary">{pendingDelete.label}</span> 기록을 삭제합니다.
            </p>
            <p className="text-xs text-text-tertiary mb-5">삭제한 기록은 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm text-text-secondary disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ type }: { type: 'saju' | 'tarot' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full bg-space-surface flex items-center justify-center text-sm font-bold text-text-tertiary mb-4"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {type === 'saju' ? '사주' : '타로'}
      </div>
      <p className="text-text-secondary text-sm mb-1">
        {type === 'saju' ? '사주 풀이 기록이 아직 없어요' : '타로 풀이 기록이 아직 없어요'}
      </p>
      <p className="text-text-tertiary text-xs">
        풀이를 진행하면 여기에 자동으로 저장됩니다
      </p>
    </div>
  );
}
