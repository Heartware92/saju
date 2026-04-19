'use client';

/**
 * 자미두수 결과 페이지 (리뉴얼)
 * - 진입 → 풀스크린 로딩 → 결과 (명반 계산 + AI 풀이 동시 대기)
 * - 별자리 SVG 시각화 (StarChart)
 * - 섹션별 은유 헤드라인 + 카드 UI
 * - AI 용어 제거 — "별이 전하는 이야기" 같은 감성 네이밍
 *
 * URL: /saju/zamidusu?year=1990&month=1&day=1&hour=12&gender=male&calendarType=solar
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculateZamidusu,
  ZamidusuResult,
  ZamidusuPalace,
} from '../engine/zamidusu';
import { buildZamidusuReading, type ZamidusuReading } from '../engine/zamidusu/reading';
import styles from './ZamidusuResultPage.module.css';
import { useProfileStore } from '../store/useProfileStore';
import { getZamidusuReading, type ZamidusuAIResult } from '../services/fortuneService';
import { ZAMIDUSU_SECTION_KEYS, ZAMIDUSU_SECTION_LABELS, type ZamidusuSectionKey } from '../constants/prompts';
import { AILoadingBar } from '../components/AILoadingBar';
import { StarChart } from '../components/zamidusu/StarChart';

const LOADING_MESSAGES = [
  '명반 12궁의 별자리를 배치하는 중입니다',
  '주인공 별과 보좌별을 확인하는 중입니다',
  '사화(四化)의 변주를 읽는 중입니다',
  '대한(大限)의 10년 리듬을 살피는 중입니다',
  '별자리 속 이야기를 엮는 중입니다',
];

// 섹션별 은유 아이콘 (이모지 X — SVG 대신 심볼 활용)
const SECTION_SYMBOL: Record<ZamidusuSectionKey, string> = {
  overview:  '◐',
  core:      '☀',
  relations: '◇',
  wealth:    '◆',
  body_mind: '◎',
  mutagen:   '✦',
  daehan:    '◐',
  advice:    '★',
};

export default function ZamidusuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

  const [chart, setChart] = useState<ZamidusuResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  const [aiResult, setAiResult] = useState<ZamidusuAIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);

  const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));
  const primaryHourUnknown = !!primary && !primary.birth_time;
  const hourUnknown = hasUrlBirth
    ? searchParams?.get('unknownTime') === 'true'
    : primaryHourUnknown;

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // 명반 계산
  useEffect(() => {
    if (hourUnknown) return;
    try {
      let year: number, month: number, day: number, hour: number;
      let gender: 'male' | 'female';
      let calendarType: 'solar' | 'lunar';

      if (hasUrlBirth) {
        year = parseInt(searchParams!.get('year')!);
        month = parseInt(searchParams!.get('month')!);
        day = parseInt(searchParams!.get('day')!);
        hour = parseInt(searchParams!.get('hour') || '12');
        gender = (searchParams!.get('gender') || 'male') as 'male' | 'female';
        calendarType = (searchParams!.get('calendarType') || 'solar') as 'solar' | 'lunar';
      } else if (primary) {
        const [y, m, d] = primary.birth_date.split('-').map(Number);
        year = y; month = m; day = d;
        hour = primary.birth_time ? parseInt(primary.birth_time.split(':')[0]) : 12;
        gender = primary.gender;
        calendarType = primary.calendar_type;
      } else {
        return;
      }

      const result = calculateZamidusu(year, month, day, hour, gender, calendarType);
      setChart(result);
    } catch (e: any) {
      setError(e?.message || '명반 계산 실패');
    }
  }, [searchParams, hourUnknown, hasUrlBirth, primary]);

  const reading: ZamidusuReading | null = useMemo(() => {
    return chart ? buildZamidusuReading(chart) : null;
  }, [chart]);

  // 명반 계산 완료되면 AI 풀이 호출
  useEffect(() => {
    if (!chart || aiResult || aiLoading) return;
    let cancelled = false;
    setAiLoading(true);
    getZamidusuReading(chart)
      .then(r => { if (!cancelled) setAiResult(r); })
      .finally(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [chart, aiResult, aiLoading]);

  // ── 시간 미상 가드 ──
  if (hourUnknown) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push('/saju/input')}>
            ← 다시 입력
          </button>
          <div className={styles.headerCenter}>
            <h1>자미두수</h1>
          </div>
        </div>
        <div style={{
          margin: '24px 16px', padding: '20px',
          background: 'var(--space-surface)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '16px',
          color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <p style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
            자미두수는 정확한 출생 시간이 필요합니다
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            자미두수는 태어난 시각(시지)에 따라 12궁 배치가 완전히 달라지는 별자리 체계예요. 시간이 없으면 별들이 어느 방에 자리 잡는지 알 수 없어 명반 자체가 성립하지 않습니다.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            대신 <strong>사주 해석</strong>은 시주 없이도 연·월·일주와 대운으로 성격·재물·애정·직업을 충실히 읽어드려요.
          </p>
          <button
            onClick={() => {
              if (!searchParams) return;
              const qs = searchParams.toString();
              router.push(`/saju/result?${qs}`);
            }}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--cta-primary)', color: '#fff',
              border: 'none', borderRadius: 10,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            사주 해석으로 이동
          </button>
        </div>
      </div>
    );
  }

  // ── 프로필 없음 가드 ──
  if (!hasUrlBirth && !primary) {
    const profileStoreReady = hydrated && lastFetchedAt !== null && !profilesLoading;
    if (!profileStoreReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[15px] font-semibold text-text-primary mb-2">대표 프로필이 없어요</p>
        <p className="text-[13px] text-text-secondary mb-4">프로필을 등록하면 자미두수를 볼 수 있어요</p>
        <button
          onClick={() => router.push('/saju/input')}
          className="px-4 py-2 rounded-lg bg-cta text-white text-[13px] font-semibold"
        >
          프로필 등록하기
        </button>
      </div>
    );
  }

  if (error) {
    return <div className={styles.loading}>{error}</div>;
  }

  // ── 풀스크린 로딩: 명반 계산 또는 AI 풀이 대기 중 ──
  if (!chart || aiLoading) {
    return (
      <AILoadingBar
        label="자미두수 명반을 펼치는 중"
        minLabel="15초"
        maxLabel="40초"
        estimatedSeconds={25}
        messages={LOADING_MESSAGES}
        topContent={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[24px] mb-1 tracking-widest" style={{ fontFamily: 'var(--font-serif)' }}>
              紫微斗數
            </div>
            <div className="text-[12px] text-text-tertiary">하늘의 별자리 지도</div>
          </motion.div>
        }
      />
    );
  }

  const sections = aiResult?.sections ?? {};

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.push('/saju/input?category=zamidusu')}
        >
          ← 다시 입력
        </button>
        <div className={styles.headerCenter}>
          <h1>자미두수</h1>
          <p className={styles.dateInfo}>
            {chart.solarDate} {chart.timeRange}
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* 자미두수란? 안내 카드 (접기·펼치기) */}
        <div className={styles.section} style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <button
            onClick={() => setIntroOpen(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              ✦ 자미두수가 뭔가요?
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {introOpen ? '접기' : '펼치기'}
            </span>
          </button>
          <AnimatePresence>
            {introOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.75, margin: '10px 0 0' }}>
                  자미두수(紫微斗數)는 <b>북극성</b>과 <b>북두칠성</b>으로 운명을 읽는 천 년 된 별자리 점성술이에요.
                  태어난 순간 하늘에 나만의 <b>별자리 지도(명반)</b>가 그려지는데, 이 지도에는 인생의 12개 방이 있어요.
                  각 방에는 다른 주인공 별이 앉아서 — 사랑·재물·건강·명예 — 인생의 각 영역을 이끌어가죠.
                  사주가 <b>내 기질·체질</b>을 본다면, 자미두수는 <b>내 인생 무대의 조명 배치</b>를 봅니다.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 별자리 시각화 */}
        <div className={styles.section}>
          <h2 style={{ textAlign: 'center', marginBottom: 4 }}>하늘에 새겨진 당신의 별자리</h2>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 14 }}>
            {chart.zodiac}띠 · {chart.sign} · {chart.fiveElementsClass}
          </p>
          <StarChart
            palaces={chart.palaces}
            soul={chart.soul}
            fiveElementsClass={chart.fiveElementsClass}
            selectedIndex={selectedPalace}
            onSelect={(idx) => setSelectedPalace(selectedPalace === idx ? null : idx)}
          />
        </div>

        {/* 선택된 궁 상세 */}
        <AnimatePresence>
          {selectedPalace !== null && (() => {
            const p = chart.palaces.find((x) => x.index === selectedPalace);
            if (!p) return null;
            return (
              <motion.div
                key={p.index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.section}
              >
                <h2>
                  ✦ {p.name}
                  {p.isBodyPalace ? ' · 신궁' : ''}
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 8 }}>
                    {p.heavenlyStem}{p.earthlyBranch}
                  </span>
                </h2>

                {/* 주성 */}
                <div className={styles.detailStarGroup}>
                  <h3>주인공 별</h3>
                  <div className={styles.chips}>
                    {p.majorStars.length === 0 ? (
                      <span className={styles.chipMuted}>공궁 — 주성 없음, 대궁의 영향을 받음</span>
                    ) : (
                      p.majorStars.map((s, i) => (
                        <span key={i} className={styles.chipMajor}>
                          {s.name}
                          {s.brightness ? ` ${s.brightness}` : ''}
                          {s.mutagen ? ` · ${s.mutagen}` : ''}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 보조성 */}
                {p.minorStars.length > 0 && (
                  <div className={styles.detailStarGroup}>
                    <h3>곁에서 돕는 별</h3>
                    <div className={styles.chips}>
                      {p.minorStars.map((s, i) => (
                        <span key={i} className={styles.chipMinor}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {p.decadalRange && (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                    대한: {p.decadalRange}
                  </p>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* AI 풀이 — 섹션별 은유 헤드라인으로 카드화 */}
        {ZAMIDUSU_SECTION_KEYS.map((key) => {
          const text = sections[key];
          if (!text) return null;
          // 본문 첫 줄 = 은유 제목으로 가정
          const lines = text.split('\n');
          const headline = lines[0]?.trim() || '';
          const body = lines.slice(1).join('\n').trim() || headline;
          const hasHeadline = lines.length > 1 && headline.length > 0 && headline.length <= 80;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={styles.section}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18, color: 'var(--cta-primary)' }}>
                  {SECTION_SYMBOL[key]}
                </span>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
                    {ZAMIDUSU_SECTION_LABELS[key]}
                  </div>
                  {hasHeadline && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 2, fontFamily: 'var(--font-serif)' }}>
                      {headline}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0 }}>
                {hasHeadline ? body : text}
              </p>
            </motion.div>
          );
        })}

        {/* AI 응답이 섹션 파싱 실패했거나 완전히 비어있으면 원문 fallback */}
        {aiResult?.content && Object.keys(sections).length === 0 && (
          <div className={styles.section}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-line', margin: 0 }}>
              {aiResult.content}
            </p>
          </div>
        )}

        {/* 엔진 기반 보조 풀이 — AI 섹션도 실패하고 원문도 없을 때만 노출 */}
        {reading && Object.keys(sections).length === 0 && !aiResult?.content && (
          <>
            <div className={styles.section}>
              <h2>✦ 명반 요약</h2>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 12 }}>
                {reading.profileHeadline}
              </p>
              {reading.coreStars.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {reading.coreStars.map((s, i) => (
                    <div key={i} style={{ padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {s.name}({s.hanja}) — {s.keywords.slice(0, 3).join(' · ')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.theme}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
}
