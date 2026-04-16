'use client';

/**
 * 사주 결과 페이지 — 전체 무료 공개
 *
 * 단일 플로우: 사주 원국 → 사주 관계(합충형파해·신살) → 오행·십성 → 신강신약 → 대운수 → 명리 풀이
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
import { calculateSaju, SajuResult } from '../utils/sajuCalculator';
import { getBasicInterpretation, getDetailedInterpretation } from '../services/fortuneService';
import { useProfileStore } from '../store/useProfileStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import SajuReport from '../components/saju/SajuReport';
import styles from './SajuResultPage.module.css';

export default function SajuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

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
          <strong>시간 미상 · 삼주추명(三柱推命)</strong>
          <p>
            출생 시간 미상으로 시주(時柱)는 제외되었습니다. 연·월·일주 기반으로
            성격·재물·직업·대운을 정상 분석하되,
            <strong> 자녀운·말년운·시간대별 상세 조언</strong>은 제한적으로만 제공됩니다.
          </p>
        </div>
      )}

      {/* Content — 단일 플로우: 사주원국 → 사주관계 → 오행·십성 → 신강신약 → 대운수 → 명리풀이 */}
      <div className={styles.content}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <SajuReport result={result} />

          {/* 6. 명리 풀이 (AI) */}
          <div className={styles.section}>
            <h2>기본 명리 풀이</h2>
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

          <div className={styles.section}>
            <h2>상세 명리학 자문 풀이</h2>
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
      </div>
    </div>
  );
}
