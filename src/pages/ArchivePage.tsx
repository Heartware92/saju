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

/** 풀이 본문에서 첫 줄(은유 제목) 추출 */
function extractTitle(record: SajuRecord): string {
  const body = record.interpretation_detailed || record.interpretation_basic || '';
  const firstLine = body.split(/\r?\n/).find((ln) => ln.trim().length > 0) || '';
  const clean = firstLine.trim();
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
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
                sajuSorted.map((record) => (
                  <Link key={record.id} href={getSajuRoute(record)} className="block">
                    <Card padding="md" hover>
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full bg-cta flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-text-primary truncate">
                              {SAJU_CATEGORY_LABEL[record.category] ?? record.category}
                            </h3>
                            {record.is_detailed && (
                              <span className="text-[10px] text-cta border border-cta/40 px-1.5 py-[1px] rounded">상세</span>
                            )}
                          </div>
                          <p className="text-xs text-text-tertiary truncate">
                            {extractTitle(record) || '풀이 다시 보기'}
                          </p>
                        </div>
                        <span className="text-[11px] text-text-tertiary flex-shrink-0">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <EmptyState type="saju" />
              )}
            </div>
          )}

          {activeTab === 'tarot' && (
            <div className="space-y-3">
              {tarotRecords.length > 0 ? (
                tarotRecords.map((record) => (
                  <Link key={record.id} href={getTarotRoute(record)} className="block">
                    <Card padding="md" hover>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[rgba(165,180,252,0.12)] flex items-center justify-center text-lg flex-shrink-0">
                          🎴
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-primary truncate">
                            {TAROT_SPREAD_LABEL[record.spread_type] ?? record.spread_type}
                          </h3>
                          <p className="text-xs text-text-tertiary truncate">
                            {record.question || '질문 없음'}
                          </p>
                        </div>
                        <span className="text-[11px] text-text-tertiary flex-shrink-0">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <EmptyState type="tarot" />
              )}
            </div>
          )}
        </motion.div>
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
