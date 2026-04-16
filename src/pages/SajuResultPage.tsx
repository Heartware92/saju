'use client';

/**
 * 사주 결과 페이지 — 전체 무료 공개
 *
 * 섹션:
 * - 원국 탭: 사주 원국표, 오행 분포, 신강신약, 용신, 격국, 십성
 * - 대운·세운 탭: 대운 10단, 세운, 신살, 합충형파해
 * - 명리 풀이 탭: 기본 + 상세 해석 (AI 생성)
 *
 * 입력 소스 우선순위:
 * 1. URL 쿼리 (year/month/day/hour/...)
 * 2. 대표 프로필
 * 3. 없으면 등록 유도
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lunar } from 'lunar-javascript';
import { calculateSaju, SajuResult, TEN_GODS_MAP } from '../utils/sajuCalculator';
import { getBasicInterpretation, getDetailedInterpretation } from '../services/fortuneService';
import { useProfileStore } from '../store/useProfileStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../engine/gyeokguk';
import { stemToHanja, zhiToHanja } from '../lib/character';
import styles from './SajuResultPage.module.css';

const formatStem = (gan: string) => `${stemToHanja(gan)}(${gan})`;
const formatBranch = (zhi: string) => `${zhiToHanja(zhi)}(${zhi})`;

const SIPSEONG_ORDER = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] as const;

const SIPSEONG_COLORS: Record<string, string> = {
  '비견': '#34D399', '겁재': '#10B981',
  '식신': '#F59E0B', '상관': '#FBBF24',
  '편재': '#FB923C', '정재': '#F97316',
  '편관': '#F43F5E', '정관': '#E11D48',
  '편인': '#60A5FA', '정인': '#3B82F6',
};

function computeSipseongDistribution(result: SajuResult) {
  const dayGan = result.dayMaster;
  const map = TEN_GODS_MAP[dayGan];
  if (!map) return {} as Record<string, number>;

  const counts: Record<string, number> = {};
  SIPSEONG_ORDER.forEach(s => { counts[s] = 0; });

  // 천간 (일간 제외)
  const stems = [
    result.pillars.year.gan,
    result.pillars.month.gan,
    result.pillars.hour.gan,
  ];
  stems.forEach(gan => {
    const s = map[gan];
    if (s && counts[s] !== undefined) counts[s] += 1;
  });

  // 지지 지장간
  const branches = [
    result.pillars.year.hiddenStems,
    result.pillars.month.hiddenStems,
    result.pillars.day.hiddenStems,
    result.pillars.hour.hiddenStems,
  ];
  branches.forEach(hidden => {
    hidden.forEach(gan => {
      const s = map[gan];
      if (s && counts[s] !== undefined) counts[s] += 0.5; // 지장간은 0.5 가중치
    });
  });

  // 반올림
  Object.keys(counts).forEach(k => { counts[k] = Math.round(counts[k] * 2) / 2; });

  return counts;
}

type TabType = 'wonguk' | 'daewoon' | 'analysis';

const ELEMENT_COLORS: Record<string, string> = {
  '목': '#34D399',
  '화': '#F43F5E',
  '토': '#F59E0B',
  '금': '#CBD5E1',
  '수': '#3B82F6'
};

export default function SajuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

  const [activeTab, setActiveTab] = useState<TabType>('wonguk');
  const [result, setResult] = useState<SajuResult | null>(null);

  const [basicAnalysis, setBasicAnalysis] = useState('');
  const [basicLoading, setBasicLoading] = useState(false);

  const [detailedAnalysis, setDetailedAnalysis] = useState('');
  const [detailedLoading, setDetailedLoading] = useState(false);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // 사주 계산 — URL 쿼리 우선, 없으면 대표 프로필 사용
  useEffect(() => {
    const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));

    if (hasUrlBirth) {
      const year = parseInt(searchParams!.get('year')!);
      const month = parseInt(searchParams!.get('month')!);
      const day = parseInt(searchParams!.get('day')!);
      const hour = parseInt(searchParams!.get('hour') || '12');
      const minute = parseInt(searchParams!.get('minute') || '0');
      const gender = (searchParams!.get('gender') || 'male') as 'male' | 'female';
      const calendarType = searchParams!.get('calendarType') || 'solar';
      const unknownTime = searchParams!.get('unknownTime') === 'true';

      let solarYear = year, solarMonth = month, solarDay = day;
      if (calendarType === 'lunar') {
        const lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
        const solar = lunar.getSolar();
        solarYear = solar.getYear();
        solarMonth = solar.getMonth();
        solarDay = solar.getDay();
      }

      // 한국식 30분 시프트 시진 — 점신/천을귀인 호환
      let finalY = solarYear, finalM = solarMonth, finalD = solarDay;
      let finalH = unknownTime ? 12 : hour;
      let finalMin = unknownTime ? 0 : minute;
      if (!unknownTime) {
        const dt = new Date(solarYear, solarMonth - 1, solarDay, hour, minute);
        const shifted = new Date(dt.getTime() - 30 * 60 * 1000);
        finalY = shifted.getFullYear();
        finalM = shifted.getMonth() + 1;
        finalD = shifted.getDate();
        finalH = shifted.getHours();
        finalMin = shifted.getMinutes();
      }

      setResult(calculateSaju(finalY, finalM, finalD, finalH, finalMin, gender, unknownTime));
    } else if (primary) {
      setResult(computeSajuFromProfile(primary));
    }
  }, [searchParams, primary]);

  // 무료 기본 해석 자동 로드
  useEffect(() => {
    if (result && !basicAnalysis && !basicLoading) {
      loadBasicAnalysis();
    }
  }, [result]);

  // 상세 해석 자동 로드 (전체 무료 공개)
  useEffect(() => {
    if (result && !detailedAnalysis && !detailedLoading) {
      loadDetailedAnalysis();
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

  const loadDetailedAnalysis = async () => {
    if (!result) return;

    setDetailedLoading(true);
    try {
      const response = await getDetailedInterpretation(result);
      if (response.success && response.content) {
        setDetailedAnalysis(response.content);
      }
    } catch (error) {
      console.error('Detailed analysis error:', error);
    } finally {
      setDetailedLoading(false);
    }
  };

  // 격국 + 십성 분포 계산 (result 의존)
  const gyeokguk = useMemo(() => (result ? determineGyeokguk(result) : null), [result]);
  const gyeokgukStatus = useMemo(
    () => (result && gyeokguk ? analyzeGyeokgukStatus(result, gyeokguk) : null),
    [result, gyeokguk]
  );
  const sipseongDist = useMemo(
    () => (result ? computeSipseongDistribution(result) : ({} as Record<string, number>)),
    [result]
  );

  if (!result) {
    const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));
    // 프로필 스토어가 아직 수화(hydrate) 중이거나 최초 fetch가 끝나지 않았으면 로딩.
    // hydrated · lastFetchedAt · loading 세 상태를 합쳐야 "확실히 프로필이 없는 상태"를 판단할 수 있다.
    // (이게 없으면 페이지 진입 직후 잠깐 "프로필 없음" UI가 번쩍였다 바뀌는 race가 생김.)
    const profileStoreReady = hydrated && lastFetchedAt !== null && !profilesLoading;

    if (!hasUrlBirth && !profileStoreReady) {
      return <div className={styles.loading}>로딩 중...</div>;
    }

    if (!hasUrlBirth && !primary) {
      return (
        <div className={styles.container}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => router.push('/')}>
              ← 홈으로
            </button>
          </div>
          <div className={styles.section} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h2>대표 프로필이 없어요</h2>
            <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>
              사주를 분석하려면 먼저 생년월일시를 등록해주세요.
            </p>
            <button
              className={styles.backBtn}
              onClick={() => router.push('/saju/input')}
              style={{ margin: '0 auto' }}
            >
              프로필 등록하기
            </button>
          </div>
        </div>
      );
    }
    return <div className={styles.loading}>로딩 중...</div>;
  }

  const { pillars, elementPercent, daeWoon, seWoon, sinSals, interactions } = result;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← 홈으로
        </button>
        <div className={styles.headerCenter}>
          <h1>사주 분석 결과</h1>
          <p className={styles.dateInfo}>
            {result.solarDate} (양력) | {result.lunarDateSimple} (음력)
          </p>
        </div>
      </div>

      {/* 시간 미상 안내 배너 — 삼주추명(三柱推命) 원칙 */}
      {result.hourUnknown && (
        <div className={styles.unknownHourBanner}>
          <strong>🕒 시간 미상 · 삼주추명(三柱推命)</strong>
          <p>
            출생 시간 미상으로 시주(時柱)는 제외되었습니다. 연·월·일주 기반으로
            성격·재물·직업·대운을 정상 분석하되,
            <strong> 자녀운·말년운·시간대별 상세 조언</strong>은 제한적으로만 제공됩니다.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'wonguk' ? styles.active : ''}`}
          onClick={() => setActiveTab('wonguk')}
        >
          사주 원국
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'daewoon' ? styles.active : ''}`}
          onClick={() => setActiveTab('daewoon')}
        >
          대운·세운
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          명리 풀이
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
                  <span className={result.hourUnknown ? styles.hourUnknownCell : ''}>
                    {result.hourUnknown ? '—' : pillars.hour.tenGodGan}
                  </span>
                  <span className={styles.highlight}>일주</span>
                  <span>{pillars.month.tenGodGan}</span>
                  <span>{pillars.year.tenGodGan}</span>
                </div>
                <div className={`${styles.pillarsRow} ${styles.stemRow}`}>
                  <span className={styles.label}>천간</span>
                  <span
                    className={result.hourUnknown ? styles.hourUnknownCell : ''}
                    style={result.hourUnknown ? undefined : { color: ELEMENT_COLORS[pillars.hour.ganElement] }}
                  >
                    {result.hourUnknown ? '?' : formatStem(pillars.hour.gan)}
                  </span>
                  <span style={{ color: ELEMENT_COLORS[pillars.day.ganElement] }}>{formatStem(pillars.day.gan)}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.month.ganElement] }}>{formatStem(pillars.month.gan)}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.year.ganElement] }}>{formatStem(pillars.year.gan)}</span>
                </div>
                <div className={`${styles.pillarsRow} ${styles.branchRow}`}>
                  <span className={styles.label}>지지</span>
                  <span
                    className={result.hourUnknown ? styles.hourUnknownCell : ''}
                    style={result.hourUnknown ? undefined : { color: ELEMENT_COLORS[pillars.hour.zhiElement] }}
                  >
                    {result.hourUnknown ? '?' : formatBranch(pillars.hour.zhi)}
                  </span>
                  <span style={{ color: ELEMENT_COLORS[pillars.day.zhiElement] }}>{formatBranch(pillars.day.zhi)}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.month.zhiElement] }}>{formatBranch(pillars.month.zhi)}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.year.zhiElement] }}>{formatBranch(pillars.year.zhi)}</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>지장간</span>
                  <span className={`${styles.hiddenStems} ${result.hourUnknown ? styles.hourUnknownCell : ''}`}>
                    {result.hourUnknown ? '—' : pillars.hour.hiddenStems.map(stemToHanja).join(' ')}
                  </span>
                  <span className={styles.hiddenStems}>{pillars.day.hiddenStems.map(stemToHanja).join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.month.hiddenStems.map(stemToHanja).join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.year.hiddenStems.map(stemToHanja).join(' ')}</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>12운성</span>
                  <span className={result.hourUnknown ? styles.hourUnknownCell : ''}>
                    {result.hourUnknown ? '—' : pillars.hour.twelveStage}
                  </span>
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
              <p className={styles.sectionHint}>
                용신은 사주에서 가장 필요한 오행이에요. 이 기운을 보태주는 색, 방향, 시기를 가까이하면 좋아요.
              </p>
            </div>

            {/* 격국 */}
            {gyeokguk && (
              <div className={styles.section}>
                <h2>🏛️ 격국 (格局)</h2>
                <div className={styles.gyeokgukBox}>
                  <div className={styles.gyeokgukHeader}>
                    <span className={styles.gyeokgukName}>
                      {gyeokguk.name}
                      {gyeokguk.nameHanja && <small> · {gyeokguk.nameHanja}</small>}
                    </span>
                    <span className={styles.gyeokgukType}>{gyeokguk.type}</span>
                  </div>
                  <p className={styles.gyeokgukDesc}>{gyeokguk.description}</p>
                  <p className={styles.gyeokgukReason}>판정 근거: {gyeokguk.reason}</p>

                  {gyeokgukStatus && (
                    <div
                      className={styles.gyeokgukStatus}
                      data-success={gyeokgukStatus.isSuccessful}
                    >
                      <strong>{gyeokgukStatus.isSuccessful ? '성격(成格)' : '패격(敗格)'}</strong>
                      <span>{gyeokgukStatus.analysis}</span>
                    </div>
                  )}

                  <div className={styles.gyeokgukTraits}>
                    <div className={styles.traitRow}>
                      <span className={styles.traitLabel}>성향 키워드</span>
                      <div className={styles.traitChips}>
                        {gyeokguk.traits.map((t) => (
                          <span key={t} className={styles.chip}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.traitRow}>
                      <span className={styles.traitLabel}>어울리는 직업</span>
                      <div className={styles.traitChips}>
                        {gyeokguk.careers.map((c) => (
                          <span key={c} className={`${styles.chip} ${styles.chipAccent}`}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className={styles.sectionHint}>
                  격국은 사주의 '주된 성격 유형'이에요. 월지에서 어떤 기운이 주도권을 잡았는지로 판정해요.
                </p>
              </div>
            )}

            {/* 십성 분포 */}
            <div className={styles.section}>
              <h2>✳️ 십성 분포 (十星)</h2>
              <div className={styles.sipseongGrid}>
                {SIPSEONG_ORDER.map((s) => {
                  const count = sipseongDist[s] || 0;
                  const dimmed = count === 0;
                  return (
                    <div
                      key={s}
                      className={`${styles.sipseongItem} ${dimmed ? styles.sipseongDim : ''}`}
                      style={{ borderColor: dimmed ? 'var(--border-subtle)' : SIPSEONG_COLORS[s] }}
                    >
                      <span
                        className={styles.sipseongName}
                        style={{ color: dimmed ? 'var(--text-tertiary)' : SIPSEONG_COLORS[s] }}
                      >
                        {s}
                      </span>
                      <span className={styles.sipseongCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <p className={styles.sectionHint}>
                십성은 일간을 기준으로 다른 간지가 어떤 역할(관성·재성·인성 등)을 하는지 보여줘요. 숫자가 많을수록 그 성향이 강해요.
              </p>
            </div>

          </motion.div>
        )}

        {/* 대운세운 탭 */}
        {activeTab === 'daewoon' && (
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
                      <span style={{ color: ELEMENT_COLORS[dw.ganElement] }}>{stemToHanja(dw.gan)}</span>
                      <span style={{ color: ELEMENT_COLORS[dw.zhiElement] }}>{zhiToHanja(dw.zhi)}</span>
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
                      <span style={{ color: ELEMENT_COLORS[sw.ganElement] }}>{stemToHanja(sw.gan)}</span>
                      <span style={{ color: ELEMENT_COLORS[sw.zhiElement] }}>{zhiToHanja(sw.zhi)}</span>
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

        {/* 명리 풀이 탭 */}
        {activeTab === 'analysis' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 기본 해석 */}
            <div className={styles.section}>
              <h2>📜 기본 명리 풀이</h2>
              {basicLoading ? (
                <div className={styles.analysisPlaceholder}>
                  <div className={styles.loadingSpinner}></div>
                  <p>명리학 알고리즘으로 분석 중...</p>
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

            {/* 상세 해석 */}
            <div className={styles.section}>
              <h2>🔮 상세 명리학 자문 풀이</h2>
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
