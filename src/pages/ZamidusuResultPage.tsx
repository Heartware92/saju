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
import { getZamidusuReading } from '../services/fortuneService';
import { useCreditStore } from '../store/useCreditStore';
import { PaywallModal, LockedCard } from '../features/saju/PaywallModal';
import styles from './ZamidusuResultPage.module.css';

export default function ZamidusuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [chart, setChart] = useState<ZamidusuResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPalace, setSelectedPalace] = useState<number | null>(null);
  // 자미두수는 시지(時支)로 명궁 위치가 결정되므로 시간 미상이면 명반 자체가 성립하지 않음
  const hourUnknown = searchParams?.get('unknownTime') === 'true';

  const { fetchBalance } = useCreditStore();

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    if (hourUnknown) return; // 시간 미상이면 계산 스킵 — 아래에서 안내 화면 렌더
    try {
      const year = parseInt(searchParams.get('year') || '1990');
      const month = parseInt(searchParams.get('month') || '1');
      const day = parseInt(searchParams.get('day') || '1');
      const hour = parseInt(searchParams.get('hour') || '12');
      const gender = (searchParams.get('gender') || 'male') as 'male' | 'female';
      const calendarType = (searchParams.get('calendarType') || 'solar') as 'solar' | 'lunar';

      const result = calculateZamidusu(year, month, day, hour, gender, calendarType);
      setChart(result);
    } catch (e: any) {
      setError(e?.message || '명반 계산 실패');
    }
  }, [searchParams, hourUnknown]);

  const handleUnlock = async () => {
    if (!chart) return;
    setLoading(true);
    try {
      const res = await getZamidusuReading(chart);
      if (res.success && res.content) {
        setInterpretation(res.content);
        setUnlocked(true);
      } else {
        alert(res.error || '해석을 불러오지 못했어요.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* 자미두수 풀이 */}
        {!unlocked ? (
          <div className={styles.unlockWrap}>
            <LockedCard type="detailed" onClick={() => setShowPaywall(true)} />
          </div>
        ) : (
          <div className={styles.section}>
            <h2>🌌 자미두수 명리학 자문 풀이</h2>
            {loading ? (
              <div className={styles.analysisPlaceholder}>
                <div className={styles.loadingSpinner} />
                <p>명반을 분석하는 중...</p>
              </div>
            ) : (
              <div className={styles.analysisResult}>
                <pre>{interpretation}</pre>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlock={handleUnlock}
        type="detailed"
      />
    </div>
  );
}
