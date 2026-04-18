'use client';

/**
 * 자미두수 결과 페이지
 * URL: /saju/zamidusu?year=1990&month=1&day=1&hour=12&gender=male&calendarType=solar
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  calculateZamidusu,
  ZamidusuResult,
  ZamidusuPalace,
  BRANCH_GRID_POSITIONS,
} from '../engine/zamidusu';
import { buildZamidusuReading, type ZamidusuReading } from '../engine/zamidusu/reading';
import styles from './ZamidusuResultPage.module.css';
import { useProfileStore } from '../store/useProfileStore';
import { getZamidusuReading } from '../services/fortuneService';

export default function ZamidusuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

  const [chart, setChart] = useState<ZamidusuResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);

  // AI 내러티브
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));
  const primaryHourUnknown = !!primary && !primary.birth_time;
  // 자미두수는 시지(時支)로 명궁 위치가 결정되므로 시간 미상이면 명반 자체가 성립하지 않음
  const hourUnknown = hasUrlBirth
    ? searchParams?.get('unknownTime') === 'true'
    : primaryHourUnknown;

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

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

  // 명반 계산 완료되면 AI 호출
  useEffect(() => {
    if (!chart || aiContent || aiLoading) return;
    let cancelled = false;
    setAiLoading(true);
    getZamidusuReading(chart)
      .then(r => { if (!cancelled && r.success) setAiContent(r.content ?? null); })
      .finally(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [chart]);

  // 12궁을 지지 기준으로 4x4 그리드 셀 매핑 (가운데 2x2는 정보 영역)
  const gridCells = useMemo(() => {
    if (!chart) return null;
    const cells: (ZamidusuPalace | null)[][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => null as ZamidusuPalace | null)
    );
    chart.palaces.forEach((p) => {
      const pos = BRANCH_GRID_POSITIONS[p.earthlyBranch];
      if (pos) cells[pos.row][pos.col] = p;
    });
    return cells;
  }, [chart]);

  // 시간 미상 차단 화면 — 자미두수는 시지(時支) 기반으로 명궁이 결정되므로
  // 시간 없이는 12궁 배치 자체가 불가능. 사주 기본 해석으로 유도.
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
        <div
          style={{
            margin: '24px 16px',
            padding: '20px',
            background: 'var(--space-surface)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            borderRadius: '16px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <p style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
            🕒 자미두수는 정확한 출생 시간이 필요합니다
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            자미두수는 시지(時支)에 따라 명궁(命宮)·신궁(身宮)을 포함한 12궁 배치가 결정되는 명리 체계입니다.
            출생 시간을 모르면 명반 자체가 성립하지 않아 해석의 근거가 사라집니다.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            대신 <strong>사주(삼주추명)</strong>은 시주 없이도 연·월·일주와 대운으로 성격·재물·애정·직업을
            충실히 해석할 수 있습니다.
          </p>
          <button
            onClick={() => {
              if (!searchParams) return;
              const qs = searchParams.toString();
              router.push(`/saju/result?${qs}`);
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--cta-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            사주 해석으로 이동
          </button>
        </div>
      </div>
    );
  }

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
  if (!chart || !gridCells) {
    return <div className={styles.loading}>명반 계산 중...</div>;
  }

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
          <h1>자미두수 명반</h1>
          <p className={styles.dateInfo}>
            {chart.solarDate} {chart.timeRange} · {chart.chineseDate}
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* 상단 요약 */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>명주</span>
            <span className={styles.summaryValue}>{chart.soul}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>신주</span>
            <span className={styles.summaryValue}>{chart.body}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>오행국</span>
            <span className={styles.summaryValue}>{chart.fiveElementsClass}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>띠·별자리</span>
            <span className={styles.summaryValue}>
              {chart.zodiac}·{chart.sign}
            </span>
          </div>
        </div>

        {/* 12궁 그리드 */}
        <div className={styles.board}>
          {gridCells.map((row, rIdx) =>
            row.map((palace, cIdx) => {
              // 가운데 2x2 정보 블록
              if (rIdx >= 1 && rIdx <= 2 && cIdx >= 1 && cIdx <= 2) {
                if (rIdx === 1 && cIdx === 1) {
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={styles.centerInfo}
                      style={{ gridRow: '2 / span 2', gridColumn: '2 / span 2' }}
                    >
                      <div className={styles.centerRow}>
                        <span>양력</span>
                        <strong>{chart.solarDate}</strong>
                      </div>
                      <div className={styles.centerRow}>
                        <span>음력</span>
                        <strong>{chart.lunarDate}</strong>
                      </div>
                      <div className={styles.centerRow}>
                        <span>시진</span>
                        <strong>{chart.time} · {chart.timeRange}</strong>
                      </div>
                      <div className={styles.centerRow}>
                        <span>성별</span>
                        <strong>{chart.gender}</strong>
                      </div>
                      <div className={styles.centerDivider} />
                      <div className={styles.centerRow}>
                        <span>명궁</span>
                        <strong>{chart.soulBranch}</strong>
                      </div>
                      <div className={styles.centerRow}>
                        <span>신궁</span>
                        <strong>{chart.bodyBranch}</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }

              if (!palace) return <div key={`${rIdx}-${cIdx}`} className={styles.emptyCell} />;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  className={`${styles.palace} ${palace.name === '명궁' ? styles.palaceMain : ''} ${palace.isBodyPalace ? styles.palaceBody : ''} ${selectedPalace === palace.index ? styles.palaceSelected : ''}`}
                  onClick={() =>
                    setSelectedPalace(selectedPalace === palace.index ? null : palace.index)
                  }
                >
                  <div className={styles.palaceHeader}>
                    <span className={styles.palaceGanzhi}>
                      {palace.heavenlyStem}
                      {palace.earthlyBranch}
                    </span>
                    <span className={styles.palaceName}>
                      {palace.name}
                      {palace.isBodyPalace ? ' · 身' : ''}
                    </span>
                  </div>
                  <div className={styles.palaceStars}>
                    {palace.majorStars.slice(0, 3).map((s, i) => (
                      <span key={i} className={styles.majorStar}>
                        {s.name}
                        {s.brightness ? <small>({s.brightness})</small> : null}
                        {s.mutagen ? <em> {s.mutagen}</em> : null}
                      </span>
                    ))}
                    {palace.minorStars.slice(0, 2).map((s, i) => (
                      <span key={`m-${i}`} className={styles.minorStar}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                  {palace.decadalRange && (
                    <div className={styles.palaceDecadal}>{palace.decadalRange}</div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 선택된 궁 상세 */}
        {selectedPalace !== null && (() => {
          const p = chart.palaces.find((x) => x.index === selectedPalace);
          if (!p) return null;
          return (
            <div className={styles.section}>
              <h2>🔍 {p.name} 상세 ({p.heavenlyStem}{p.earthlyBranch})</h2>
              <div className={styles.detailStarGroup}>
                <h3>주성 (主星)</h3>
                <div className={styles.chips}>
                  {p.majorStars.length === 0 ? (
                    <span className={styles.chipMuted}>공궁 (주성 없음)</span>
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
              {p.minorStars.length > 0 && (
                <div className={styles.detailStarGroup}>
                  <h3>보조성 (輔星)</h3>
                  <div className={styles.chips}>
                    {p.minorStars.map((s, i) => (
                      <span key={i} className={styles.chipMinor}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {p.adjectiveStars.length > 0 && (
                <div className={styles.detailStarGroup}>
                  <h3>잡성 (雜星)</h3>
                  <div className={styles.chips}>
                    {p.adjectiveStars.slice(0, 10).map((s, i) => (
                      <span key={i} className={styles.chipAdjective}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 자미두수 무료 풀이 */}
        {reading && (
          <>
            {/* 프로필 헤드라인 */}
            <div className={styles.section}>
              <h2>🌌 명반 요약</h2>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 12 }}>
                {reading.profileHeadline}
              </p>

              {/* 명궁 주성 */}
              {reading.coreStars.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 12, marginBottom: 6 }}>
                    명궁 주성
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {reading.coreStars.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 10,
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 10,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {s.name}({s.hanja}) — {s.keywords.slice(0, 3).join(' · ')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {s.theme}
                        </div>
                        {s.mutagen && (
                          <div style={{ fontSize: 11, color: '#FBBF24', marginTop: 4 }}>
                            {s.mutagen.name} — {s.mutagen.effect}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 보조성 */}
              {reading.helperStars.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 12, marginBottom: 6 }}>
                    명궁 6길성 보좌
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {reading.helperStars.map((h, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          background: 'rgba(52,211,153,0.1)',
                          color: '#34D399',
                          borderRadius: 6,
                          border: '1px solid rgba(52,211,153,0.35)',
                        }}
                        title={h.effect}
                      >
                        {h.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 사화(四化) */}
            {reading.mutagens.length > 0 && (
              <div className={styles.section}>
                <h2>✨ 사화(四化) — 별의 변동</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reading.mutagens.map((m, i) => {
                    const color =
                      m.type === '화록' ? '#34D399'
                      : m.type === '화권' ? '#60A5FA'
                      : m.type === '화과' ? '#FBBF24'
                      : '#F87171';
                    return (
                      <div
                        key={i}
                        style={{
                          padding: 10,
                          background: `${color}12`,
                          border: `1px solid ${color}55`,
                          borderRadius: 10,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>
                          {m.type} · {m.star} @ {m.palace}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                          {m.effect}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          긍정: {m.positive} / 주의: {m.caution}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 주요 궁 요약 */}
            <div className={styles.section}>
              <h2>🏛 주요 궁 풀이</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reading.domainSummaries.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 10,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {d.palace}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {d.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 조언 · 주의 */}
            <div className={styles.section}>
              <h2>💡 조언</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reading.advice.map((a, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#34D399' }}>✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.section}>
              <h2>⚠️ 주의할 점</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reading.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#F87171' }}>!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* AI 명반 해석 */}
        {(aiLoading || aiContent) && (
          <div className={styles.section}>
            <h2>AI 명반 해석</h2>
            {aiLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cta-primary)' }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>자미두수 명반 해석 생성중…</span>
              </div>
            ) : aiContent ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-line', margin: 0 }}>
                {aiContent}
              </p>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
