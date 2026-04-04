'use client';

/**
 * 사주 결과 페이지 (Paywall 통합 버전)
 *
 * 무료 (0엽전):
 * - 사주 원국표, 오행 분포, 신강신약, 용신
 * - 기본 AI 해석 (200-300자)
 *
 * 유료 (2엽전):
 * - 대운/세운 상세
 * - 신살, 합충형파해
 * - 상세 AI 해석 (1500-2000자)
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { calculateSaju, SajuResult } from '../utils/sajuCalculator';
import { getCorrectedTimeForSaju } from '../utils/timeCorrection';
import { getBasicInterpretation, getDetailedInterpretation } from '../services/fortuneService';
import { PaywallModal, LockedCard } from '../features/saju/PaywallModal';
import { useCreditStore } from '../store/useCreditStore';
import styles from './SajuResultPage.module.css';

type TabType = 'wonguk' | 'daewoon' | 'analysis';

const ELEMENT_COLORS: Record<string, string> = {
  '목': '#4CAF50',
  '화': '#F44336',
  '토': '#DDA15E',
  '금': '#9E9E9E',
  '수': '#2196F3'
};

export default function SajuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('wonguk');
  const [result, setResult] = useState<SajuResult | null>(null);

  // 기본 해석 (무료)
  const [basicAnalysis, setBasicAnalysis] = useState('');
  const [basicLoading, setBasicLoading] = useState(false);

  // 상세 해석 (유료)
  const [detailedAnalysis, setDetailedAnalysis] = useState('');
  const [isDetailUnlocked, setIsDetailUnlocked] = useState(false);
  const [detailedLoading, setDetailedLoading] = useState(false);

  // Paywall 모달
  const [showPaywall, setShowPaywall] = useState(false);

  // 크레딧 스토어
  const { fetchBalance, sunBalance, moonBalance } = useCreditStore();

  // 크레딧 잔액 로드
  useEffect(() => {
    console.log('[SajuResultPage] 페이지 로드, 잔액 조회 시작');
    fetchBalance();
  }, []);

  // 디버깅: showPaywall 상태 변화 감지
  useEffect(() => {
    console.log('[SajuResultPage] showPaywall 상태:', showPaywall);
  }, [showPaywall]);

  // 디버깅: balance 변화 감지
  useEffect(() => {
    console.log('[SajuResultPage] 현재 잔액 - 해:', sunBalance, '달:', moonBalance);
  }, [sunBalance, moonBalance]);

  // LockedCard 클릭 핸들러
  const handleLockedCardClick = () => {
    console.log('[SajuResultPage] LockedCard 클릭됨, 모달 열기');
    setShowPaywall(true);
  };

  // 대운 탭 클릭 핸들러
  const handleDaewoonTabClick = () => {
    console.log('[SajuResultPage] 대운 탭 클릭됨, isDetailUnlocked:', isDetailUnlocked);
    if (!isDetailUnlocked) {
      console.log('[SajuResultPage] 잠김 상태 - 모달 열기');
      setShowPaywall(true);
    } else {
      console.log('[SajuResultPage] 잠금 해제됨 - 대운 탭으로 전환');
      setActiveTab('daewoon');
    }
  };

  // 사주 계산
  useEffect(() => {
    const year = parseInt(searchParams?.get('year') || '1990');
    const month = parseInt(searchParams?.get('month') || '1');
    const day = parseInt(searchParams?.get('day') || '1');
    const hour = parseInt(searchParams?.get('hour') || '12');
    const minute = parseInt(searchParams?.get('minute') || '0');
    const gender = (searchParams?.get('gender') || 'male') as 'male' | 'female';
    const longitude = parseFloat(searchParams?.get('longitude') || '126.978');
    const useTrueSolarTime = searchParams?.get('useTrueSolarTime') === 'true';

    let finalHour = hour;
    let finalMinute = minute;

    if (useTrueSolarTime) {
      const corrected = getCorrectedTimeForSaju(year, month, day, hour, minute, longitude);
      finalHour = corrected.finalHour;
      finalMinute = corrected.trueSolarTime.trueSolarTime.getMinutes();
    }

    const sajuResult = calculateSaju(year, month, day, finalHour, finalMinute, gender);
    setResult(sajuResult);
  }, [searchParams]);

  // 무료 기본 해석 자동 로드
  useEffect(() => {
    if (result && !basicAnalysis && !basicLoading) {
      loadBasicAnalysis();
    }
  }, [result]);

  const loadBasicAnalysis = async () => {
    if (!result) return;

    setBasicLoading(true);
    try {
      const response = await getBasicInterpretation(result);
      if (response.success && response.content) {
        setBasicAnalysis(response.content);
      }
    } catch (error) {
      console.error('Basic analysis error:', error);
    } finally {
      setBasicLoading(false);
    }
  };

  // 상세 해석 잠금 해제
  const handleUnlockDetail = async () => {
    if (!result) return;

    setDetailedLoading(true);
    try {
      const response = await getDetailedInterpretation(result);
      if (response.success && response.content) {
        setDetailedAnalysis(response.content);
        setIsDetailUnlocked(true);
      } else {
        alert(response.error || '상세 해석을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      alert('오류가 발생했습니다.');
    } finally {
      setDetailedLoading(false);
    }
  };

  if (!result) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  const { pillars, elementPercent, daeWoon, seWoon, sinSals, interactions } = result;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/saju')}>
          ← 다시 입력
        </button>
        <h1>사주 분석 결과</h1>
        <p className={styles.dateInfo}>
          {result.solarDate} (양력) | {result.lunarDateSimple} (음력)
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'wonguk' ? styles.active : ''}`}
          onClick={() => setActiveTab('wonguk')}
        >
          사주 원국 (무료)
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'daewoon' ? styles.active : ''}`}
          onClick={handleDaewoonTabClick}
        >
          대운·세운 {!isDetailUnlocked && '🔒'}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          AI 풀이
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* 원국 탭 (무료) */}
        {activeTab === 'wonguk' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 사주 원국표 */}
            <div className={styles.section}>
              <h2>📜 사주 원국 (만세력)</h2>
              <div className={styles.pillarsTable}>
                <div className={styles.pillarsHeader}>
                  <span>시주</span>
                  <span>일주</span>
                  <span>월주</span>
                  <span>년주</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>십성</span>
                  <span>{pillars.hour.tenGodGan}</span>
                  <span className={styles.highlight}>일주</span>
                  <span>{pillars.month.tenGodGan}</span>
                  <span>{pillars.year.tenGodGan}</span>
                </div>
                <div className={`${styles.pillarsRow} ${styles.stemRow}`}>
                  <span className={styles.label}>천간</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.hour.ganElement] }}>{pillars.hour.gan}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.day.ganElement] }}>{pillars.day.gan}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.month.ganElement] }}>{pillars.month.gan}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.year.ganElement] }}>{pillars.year.gan}</span>
                </div>
                <div className={`${styles.pillarsRow} ${styles.branchRow}`}>
                  <span className={styles.label}>지지</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.hour.zhiElement] }}>{pillars.hour.zhi}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.day.zhiElement] }}>{pillars.day.zhi}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.month.zhiElement] }}>{pillars.month.zhi}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.year.zhiElement] }}>{pillars.year.zhi}</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>지장간</span>
                  <span className={styles.hiddenStems}>{pillars.hour.hiddenStems.join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.day.hiddenStems.join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.month.hiddenStems.join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.year.hiddenStems.join(' ')}</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>12운성</span>
                  <span>{pillars.hour.twelveStage}</span>
                  <span>{pillars.day.twelveStage}</span>
                  <span>{pillars.month.twelveStage}</span>
                  <span>{pillars.year.twelveStage}</span>
                </div>
              </div>
            </div>

            {/* 오행 분포 */}
            <div className={styles.section}>
              <h2>⚖️ 오행 분포</h2>
              <div className={styles.elementChart}>
                {Object.entries(elementPercent).map(([element, percent]) => (
                  <div key={element} className={styles.elementBar}>
                    <div className={styles.elementLabel}>
                      <span style={{ color: ELEMENT_COLORS[element] }}>{element}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className={styles.barContainer}>
                      <motion.div
                        className={styles.bar}
                        style={{ backgroundColor: ELEMENT_COLORS[element] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 신강/신약 */}
            <div className={styles.section}>
              <h2>💪 신강/신약 판정</h2>
              <div className={styles.strengthBox}>
                <div className={styles.strengthBadge} data-strong={result.isStrong}>
                  {result.isStrong ? '신강' : '신약'} ({result.strengthScore}점)
                </div>
                <p>{result.strengthAnalysis}</p>
              </div>
            </div>

            {/* 용신 */}
            <div className={styles.section}>
              <h2>🎯 용신/희신/기신</h2>
              <div className={styles.yongshinBox}>
                <div className={styles.yongshinItem}>
                  <span className={styles.yLabel}>용신</span>
                  <span className={styles.yValue}>{result.yongSinElement} ({result.yongSin})</span>
                </div>
                <div className={styles.yongshinItem}>
                  <span className={styles.yLabel}>희신</span>
                  <span className={styles.yValue}>{result.heeSin}</span>
                </div>
                <div className={styles.yongshinItem}>
                  <span className={styles.yLabel}>기신</span>
                  <span className={styles.yValue}>{result.giSin}</span>
                </div>
              </div>
            </div>

            {/* 상세 분석 잠금 카드 */}
            {!isDetailUnlocked && (
              <div className="mt-8">
                <LockedCard type="detailed" onClick={handleLockedCardClick} />
              </div>
            )}
          </motion.div>
        )}

        {/* 대운세운 탭 (유료) */}
        {activeTab === 'daewoon' && isDetailUnlocked && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 대운 */}
            <div className={styles.section}>
              <h2>📈 대운 (10년 주기)</h2>
              <p className={styles.subInfo}>대운 시작: {result.daeWoonStartAge}세</p>
              <div className={styles.daewoonScroll}>
                {daeWoon.slice(0, 10).map((dw, idx) => (
                  <div key={idx} className={styles.daewoonCard}>
                    <div className={styles.dwAge}>{dw.startAge}~{dw.endAge}세</div>
                    <div className={styles.dwGanZhi}>
                      <span style={{ color: ELEMENT_COLORS[dw.ganElement] }}>{dw.gan}</span>
                      <span style={{ color: ELEMENT_COLORS[dw.zhiElement] }}>{dw.zhi}</span>
                    </div>
                    <div className={styles.dwInfo}>
                      <span>{dw.tenGod}</span>
                      <span>{dw.twelveStage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 세운 */}
            <div className={styles.section}>
              <h2>📅 세운 (연운)</h2>
              <div className={styles.sewoonGrid}>
                {seWoon.map((sw, idx) => (
                  <div key={idx} className={`${styles.sewoonCard} ${idx === 0 ? styles.current : ''}`}>
                    <div className={styles.swYear}>{sw.year}년</div>
                    <div className={styles.swAnimal}>{sw.animal}띠</div>
                    <div className={styles.swGanZhi}>
                      <span style={{ color: ELEMENT_COLORS[sw.ganElement] }}>{sw.gan}</span>
                      <span style={{ color: ELEMENT_COLORS[sw.zhiElement] }}>{sw.zhi}</span>
                    </div>
                    <div className={styles.swInfo}>
                      <span>{sw.tenGod}</span>
                      <span>{sw.twelveStage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 신살 */}
            {sinSals.length > 0 && (
              <div className={styles.section}>
                <h2>✨ 신살</h2>
                <div className={styles.sinsalList}>
                  {sinSals.map((sinsal, idx) => (
                    <div key={idx} className={styles.sinsalItem} data-type={sinsal.type}>
                      <span className={styles.sinsalName}>{sinsal.name}</span>
                      <span className={styles.sinsalDesc}>{sinsal.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 합충형파해 */}
            {interactions.length > 0 && (
              <div className={styles.section}>
                <h2>🔄 합충형파해</h2>
                <div className={styles.interactionList}>
                  {interactions.map((inter, idx) => (
                    <div key={idx} className={styles.interactionItem} data-type={inter.type}>
                      <span className={styles.interType}>{inter.type}</span>
                      <span className={styles.interDesc}>{inter.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* AI 풀이 탭 */}
        {activeTab === 'analysis' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 기본 해석 (무료) */}
            <div className={styles.section}>
              <h2>🤖 기본 AI 풀이 (무료)</h2>
              {basicLoading ? (
                <div className={styles.analysisPlaceholder}>
                  <div className={styles.loadingSpinner}></div>
                  <p>AI가 분석 중...</p>
                </div>
              ) : basicAnalysis ? (
                <div className={styles.analysisResult}>
                  <pre>{basicAnalysis}</pre>
                </div>
              ) : (
                <div className={styles.analysisPlaceholder}>
                  <p>기본 해석을 불러오는 중...</p>
                </div>
              )}
            </div>

            {/* 상세 해석 (유료) */}
            {!isDetailUnlocked ? (
              <div className="mt-8">
                <LockedCard type="detailed" onClick={handleLockedCardClick} />
              </div>
            ) : (
              <div className={styles.section}>
                <h2>🔮 상세 AI 풀이 (☀️ 2)</h2>
                {detailedLoading ? (
                  <div className={styles.analysisPlaceholder}>
                    <div className={styles.loadingSpinner}></div>
                    <p>상세 분석 중...</p>
                  </div>
                ) : detailedAnalysis ? (
                  <div className={styles.analysisResult}>
                    <pre>{detailedAnalysis}</pre>
                  </div>
                ) : (
                  <div className={styles.analysisPlaceholder}>
                    <p>상세 해석을 불러오는 중...</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlock={handleUnlockDetail}
        type="detailed"
      />
    </div>
  );
}
