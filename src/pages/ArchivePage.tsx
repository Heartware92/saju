'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  // 40자 이상이면 자름
  const clean = firstLine.trim();
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
}

export default function ArchivePage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('saju');
  const [sajuRecords, setSajuRecords] = useState<SajuRecord[]>([]);
  const [tarotRecords, setTarotRecords] = useState<TarotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaju, setSelectedSaju] = useState<SajuRecord | null>(null);
  const [selectedTarot, setSelectedTarot] = useState<TarotRecord | null>(null);

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

  const sajuByCategory = useMemo(() => {
    // 그룹화는 일단 안 함 — 최신순 리스트 그대로
    return sajuRecords;
  }, [sajuRecords]);

  // 비로그인 가드
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
        <p className="text-sm text-text-secondary mt-1">이전에 진행한 풀이 기록</p>
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

      {/* 상태 */}
      {loading && (
        <div className="text-center py-12 text-text-tertiary text-sm">불러오는 중…</div>
      )}
      {error && !loading && (
        <div className="text-center py-8 text-text-secondary text-sm">{error}</div>
      )}

      {/* Content */}
      {!loading && !error && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'saju' && (
            <div className="space-y-3">
              {sajuByCategory.length > 0 ? (
                sajuByCategory.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedSaju(record)}
                    className="w-full text-left"
                  >
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
                            {extractTitle(record) || '풀이 보기'}
                          </p>
                        </div>
                        <span className="text-[11px] text-text-tertiary flex-shrink-0">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                    </Card>
                  </button>
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
                  <button
                    key={record.id}
                    onClick={() => setSelectedTarot(record)}
                    className="w-full text-left"
                  >
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
                  </button>
                ))
              ) : (
                <EmptyState type="tarot" />
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 상세 모달 */}
      <AnimatePresence>
        {selectedSaju && (
          <DetailModal
            title={SAJU_CATEGORY_LABEL[selectedSaju.category] ?? selectedSaju.category}
            subtitle={formatDate(selectedSaju.created_at)}
            body={selectedSaju.interpretation_detailed || selectedSaju.interpretation_basic || '본문이 없어요.'}
            onClose={() => setSelectedSaju(null)}
          />
        )}
        {selectedTarot && (
          <DetailModal
            title={TAROT_SPREAD_LABEL[selectedTarot.spread_type] ?? selectedTarot.spread_type}
            subtitle={`${formatDate(selectedTarot.created_at)}${selectedTarot.question ? ` · ${selectedTarot.question}` : ''}`}
            body={selectedTarot.interpretation || '본문이 없어요.'}
            onClose={() => setSelectedTarot(null)}
          />
        )}
      </AnimatePresence>
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

function DetailModal({
  title,
  subtitle,
  body,
  onClose,
}: {
  title: string;
  subtitle: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-[calc(16px+64px+env(safe-area-inset-bottom,0px))] sm:pb-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[calc(100dvh-100px-env(safe-area-inset-bottom,0px))] overflow-y-auto rounded-2xl bg-[rgba(20,12,38,0.98)] border border-[var(--border-subtle)] shadow-2xl"
      >
        <header className="sticky top-0 bg-[rgba(20,12,38,0.98)] border-b border-[var(--border-subtle)] px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text-primary">{title}</h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary p-1 rounded-lg"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="px-5 py-4">
          <pre className="whitespace-pre-wrap text-[14px] leading-relaxed text-text-secondary font-sans">
            {body}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}
