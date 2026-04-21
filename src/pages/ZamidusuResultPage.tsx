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

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { ZAMIDUSU_SECTION_KEYS, ZAMIDUSU_SECTION_LABELS } from '../constants/prompts';
import { AILoadingBar } from '../components/AILoadingBar';
import { StarChart } from '../components/zamidusu/StarChart';

const LOADING_MESSAGES = [
  '명반 12궁의 별자리를 배치하는 중입니다',
  '주인공 별과 보좌별을 확인하는 중입니다',
  '사화(四化)의 변주를 읽는 중입니다',
  '대한(大限)의 10년 리듬을 살피는 중입니다',
  '별자리 속 이야기를 엮는 중입니다',
];


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

  // 모달 오픈 시 ESC 키로 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (selectedPalace === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPalace(null);
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedPalace]);

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

  // 명반 계산 완료되면 AI 풀이 호출 (45초 하드 타임아웃 — 어떤 경우든 로딩 해제 보장)
  // useRef 가드로 StrictMode·재렌더에서 중복 호출 방지
  const aiStartedRef = useRef(false);
  useEffect(() => {
    if (!chart) return;
    if (aiStartedRef.current) return;
    aiStartedRef.current = true;

    let cancelled = false;
    setAiLoading(true);

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setAiResult({
        success: false,
        error: '응답이 너무 오래 걸려요. 아래 명반은 정상이니 확인하시고, 풀이는 다시 시도해주세요.',
      });
      setAiLoading(false);
    }, 45_000);

    getZamidusuReading(chart)
      .then(r => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setAiResult(r);
        setAiLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setAiResult({ success: false, error: err?.message || 'AI 풀이 실패' });
        setAiLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [chart]);

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
        <p className="text-[17px] font-semibold text-text-primary mb-2">대표 프로필이 없어요</p>
        <p className="text-[15px] text-text-secondary mb-4">프로필을 등록하면 자미두수를 볼 수 있어요</p>
        <button
          onClick={() => router.push('/saju/input')}
          className="px-4 py-2 rounded-lg bg-cta text-white text-[15px] font-semibold"
        >
          프로필 등록하기
        </button>
      </div>
    );
  }

  if (error) {
    return <div className={styles.loading}>{error}</div>;
  }

  // ── 풀스크린 로딩: 명반 계산 OR AI 풀이 대기 중 ──
  // 한번에 모든 내용이 준비되어 쭉 보이도록 풀스크린으로 대기
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
            <div className="text-[28px] mb-1 tracking-widest" style={{ fontFamily: 'var(--font-serif)' }}>
              紫微斗數
            </div>
            <div className="text-[15px] text-text-tertiary">하늘의 별자리 지도</div>
          </motion.div>
        }
      />
    );
  }

  const sections = aiResult?.sections ?? {};
  const aiFailed = !!aiResult && !aiResult.success;

  const retryAI = () => {
    aiStartedRef.current = false;
    setAiResult(null);
    setAiLoading(false);
    // effect가 chart 의존성이라 chart 여전히 같으면 재실행 안 됨 → 강제로 state 초기화 후
    // 즉시 수동 재호출
    if (!chart) return;
    aiStartedRef.current = true;
    setAiLoading(true);
    getZamidusuReading(chart)
      .then(r => {
        setAiResult(r);
        setAiLoading(false);
      })
      .catch(err => {
        setAiResult({ success: false, error: err?.message || 'AI 풀이 실패' });
        setAiLoading(false);
      });
  };

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

        {/* AI 풀이 실패 배너 + 재시도 */}
        {aiFailed && (
          <div
            className={styles.section}
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.35)',
            }}
          >
            <p style={{ fontSize: 13, color: '#F87171', fontWeight: 600, marginBottom: 6 }}>
              별자리 풀이를 불러오지 못했어요
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {aiResult?.error || '잠시 후 다시 시도해주세요.'} 아래 명반 자체는 정상적으로 계산되어 있어 바로 확인할 수 있어요.
            </p>
            <button
              onClick={retryAI}
              style={{
                padding: '8px 16px',
                background: 'var(--cta-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              다시 풀이받기
            </button>
          </div>
        )}

        {/* 자미두수란? 안내 카드 */}
        <div className={styles.section} style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <button
            onClick={() => setIntroOpen(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              자미두수가 뭔가요?
            </span>
            <span style={{ fontSize: 14, color: 'var(--cta-primary)', fontWeight: 600 }}>
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
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.85, letterSpacing: '-0.005em', margin: '14px 0 0' }}>
                  자미두수(紫微斗數)는 <b style={{ color: 'var(--text-primary)' }}>북극성</b>과 <b style={{ color: 'var(--text-primary)' }}>북두칠성</b>으로 운명을 읽는 천 년 된 별자리 점성술이에요.
                  태어난 순간 하늘에 나만의 <b style={{ color: 'var(--text-primary)' }}>별자리 지도(명반)</b>가 그려지는데, 이 지도에는 인생의 12개 방이 있어요.
                  각 방에는 다른 주인공 별이 앉아서 — 사랑·재물·건강·명예 — 인생의 각 영역을 이끌어가죠.
                  사주가 <b style={{ color: 'var(--text-primary)' }}>내 기질·체질</b>을 본다면, 자미두수는 <b style={{ color: 'var(--text-primary)' }}>내 인생 무대의 조명 배치</b>를 봅니다.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 명반 요약 메타 — 별도 섹션으로 분리 + 크게 */}
        <div className={styles.section} style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>띠</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{chart.zodiac}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>별자리</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{chart.sign}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>오행국</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FBBF24', fontFamily: 'var(--font-serif)' }}>{chart.fiveElementsClass}</div>
            </div>
          </div>
        </div>

        {/* 별자리 시각화 */}
        <div className={styles.section}>
          <h2 style={{ textAlign: 'center', marginBottom: 14, fontSize: 18 }}>하늘에 새겨진 당신의 별자리</h2>
          <StarChart
            palaces={chart.palaces}
            soul={chart.soul}
            fiveElementsClass={chart.fiveElementsClass}
            selectedIndex={selectedPalace}
            onSelect={(idx) => setSelectedPalace(selectedPalace === idx ? null : idx)}
          />
        </div>

        {/* 선택된 궁 상세 — 모달 오버레이 */}
        <AnimatePresence>
          {selectedPalace !== null && (() => {
            const p = chart.palaces.find((x) => x.index === selectedPalace);
            if (!p) return null;
            return (
              <motion.div
                key="palace-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedPalace(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 100,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  overflowY: 'auto',
                }}
              >
                {/* 모달 카드 — transform 대신 flex 센터링 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.22 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'relative',
                    width: 'min(380px, 100%)',
                    maxHeight: 'calc(100vh - 100px)',
                    overflowY: 'auto',
                    background: 'rgba(20, 12, 38, 0.98)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 18,
                    padding: 22,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* 닫기 버튼 */}
                  <button
                    onClick={() => setSelectedPalace(null)}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      fontSize: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="닫기"
                  >
                    ✕
                  </button>

                  {/* 헤더 */}
                  <div style={{ marginBottom: 18, paddingRight: 36 }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      {p.name}
                      {p.isBodyPalace && (
                        <span style={{ fontSize: 14, color: '#F472B6', marginLeft: 8, fontWeight: 500 }}>
                          · 신궁
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--text-tertiary)',
                        marginTop: 4,
                        letterSpacing: 1,
                      }}
                    >
                      {p.heavenlyStem}{p.earthlyBranch}
                      {p.decadalRange && ` · 대한 ${p.decadalRange}`}
                    </div>
                  </div>

                  {/* 주성 */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      주인공 별
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.majorStars.length === 0 ? (
                        <span
                          style={{
                            fontSize: 14,
                            padding: '8px 14px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          공궁 — 주성 없음, 대궁의 영향을 받음
                        </span>
                      ) : (
                        p.majorStars.map((s, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              padding: '8px 14px',
                              borderRadius: 999,
                              background: 'rgba(196,181,253,0.15)',
                              color: '#D8BFFD',
                              border: '1px solid rgba(196,181,253,0.35)',
                            }}
                          >
                            {s.name}
                            {s.brightness ? ` ${s.brightness}` : ''}
                            {s.mutagen && (
                              <span style={{ color: '#FBBF24', marginLeft: 4 }}>· {s.mutagen}</span>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 보조성 */}
                  {p.minorStars.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-tertiary)',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          marginBottom: 8,
                        }}
                      >
                        곁에서 돕는 별
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.minorStars.map((s, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 14,
                              padding: '6px 12px',
                              borderRadius: 999,
                              background: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 잡성 (일부) */}
                  {p.adjectiveStars.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-tertiary)',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          marginBottom: 8,
                        }}
                      >
                        기타 별
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {p.adjectiveStars.slice(0, 8).map((s, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 12,
                              padding: '4px 10px',
                              borderRadius: 999,
                              color: 'var(--text-tertiary)',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
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
              {/* 섹션 레이블 — 정통사주와 동일 패턴 (세로바 + 큰 레이블) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ display: 'inline-block', width: 4, height: 20, borderRadius: 2, background: 'var(--cta-primary)' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em' }}>
                  {ZAMIDUSU_SECTION_LABELS[key]}
                </div>
              </div>

              {/* 은유 제목 부제 */}
              {hasHeadline && (
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--cta-primary)', opacity: 0.9, lineHeight: 1.5, marginBottom: 14, paddingLeft: 12, fontFamily: 'var(--font-serif)' }}>
                  {headline}
                </div>
              )}

              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.85, letterSpacing: '-0.005em', whiteSpace: 'pre-line', margin: 0 }}>
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
              <h2>명반 요약</h2>
              <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 12 }}>
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
