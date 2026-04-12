'use client';

/**
 * 토정비결 결과 페이지
 * URL: /saju/tojeong?year=1990&month=1&day=1&calendarType=solar&...
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { calculateTojeong, TojeongResult } from '../engine/tojeong';
import { getTojeongReading } from '../services/fortuneService';
import { useCreditStore } from '../store/useCreditStore';
import { PaywallModal, LockedCard } from '../features/saju/PaywallModal';
import styles from './SajuResultPage.module.css';

export default function TojeongResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tojeong, setTojeong] = useState<TojeongResult | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { fetchBalance } = useCreditStore();

  useEffect(() => {
    fetchBalance();
  }, []);

  // 계산
  useEffect(() => {
    if (!searchParams) return;
    const year = parseInt(searchParams.get('year') || '1990');
    const month = parseInt(searchParams.get('month') || '1');
    const day = parseInt(searchParams.get('day') || '1');
    const calendarType = (searchParams.get('calendarType') || 'solar') as 'solar' | 'lunar';
    const targetYear = parseInt(searchParams.get('targetYear') || String(new Date().getFullYear()));

    const result = calculateTojeong(year, month, day, calendarType, targetYear);
    setTojeong(result);
  }, [searchParams]);

  const handleUnlock = async () => {
    if (!tojeong) return;
    setLoading(true);
    try {
      const res = await getTojeongReading(tojeong);
      if (res.success && res.content) {
        setInterpretation(res.content);
        setUnlocked(true);
      } else {
        alert(res.error || '해석을 불러오지 못했어요.');
      }
    } catch (e: any) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const paragraphs = useMemo(() => {
    if (!interpretation) return [] as string[];
    return interpretation.split('\n').filter(Boolean);
  }, [interpretation]);

  if (!tojeong) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/saju/input?category=tojeong')}>
          ← 다시 입력
        </button>
        <div className={styles.headerCenter}>
          <h1>📖 {tojeong.targetYear}년 토정비결</h1>
          <p className={styles.dateInfo}>
            세는 나이 {tojeong.age}세 · {tojeong.yearGanZhi.ganZhi}년
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* 괘 번호 대형 표시 */}
        <div className={styles.section}>
          <h2>🎴 올해의 괘</h2>
          <div className={styles.gwaeBig}>
            <div className={styles.gwaeNumber}>{tojeong.gwaeNumber}</div>
            <div className={styles.gwaeSub}>
              상괘 {tojeong.upper} · 중괘 {tojeong.middle} · 하괘 {tojeong.lower}
            </div>
          </div>
        </div>

        {/* 괘 구성 3요소 */}
        <div className={styles.section}>
          <h2>🔍 괘 풀이</h2>

          <div className={styles.gwaeBreakdown}>
            <div className={styles.gwaeRow}>
              <span className={styles.gwaeLabel}>상괘</span>
              <div className={styles.gwaeBody}>
                <div className={styles.gwaeName}>
                  <span className={styles.gwaeSymbol}>{tojeong.upperGwae.symbol}</span>
                  {tojeong.upperGwae.name}({tojeong.upperGwae.hanja})
                  <small> · {tojeong.upperGwae.element}</small>
                </div>
                <div className={styles.gwaeMean}>{tojeong.upperGwae.meaning}</div>
                <div className={styles.gwaeFormula}>{tojeong.formula.upper}</div>
              </div>
            </div>

            <div className={styles.gwaeRow}>
              <span className={styles.gwaeLabel}>중괘</span>
              <div className={styles.gwaeBody}>
                <div className={styles.gwaeName}>{tojeong.middleGwae.position}</div>
                <div className={styles.gwaeMean}>{tojeong.middleGwae.meaning}</div>
                <div className={styles.gwaeFormula}>{tojeong.formula.middle}</div>
              </div>
            </div>

            <div className={styles.gwaeRow}>
              <span className={styles.gwaeLabel}>하괘</span>
              <div className={styles.gwaeBody}>
                <div className={styles.gwaeName}>{tojeong.lowerGwae.name}</div>
                <div className={styles.gwaeMean}>{tojeong.lowerGwae.meaning}</div>
                <div className={styles.gwaeFormula}>{tojeong.formula.lower}</div>
              </div>
            </div>
          </div>
          <p className={styles.sectionHint}>
            토정비결은 생년의 음력 나이·월·일을 해당 해의 간지와 조합해 144괘 중 하나를 뽑아 그 해의 운을 봅니다.
          </p>
        </div>

        {/* AI 풀이 */}
        {!unlocked ? (
          <div className="mt-4">
            <LockedCard type="detailed" onClick={() => setShowPaywall(true)} />
          </div>
        ) : (
          <div className={styles.section}>
            <h2>🤖 AI 풀이 (총운 + 월별)</h2>
            {loading ? (
              <div className={styles.analysisPlaceholder}>
                <div className={styles.loadingSpinner} />
                <p>AI가 괘를 풀이 중...</p>
              </div>
            ) : (
              <div className={styles.analysisResult}>
                <pre>{paragraphs.join('\n')}</pre>
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
