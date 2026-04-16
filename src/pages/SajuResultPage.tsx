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
import { calculateSaju, SajuResult, TEN_GODS_MAP } from '../utils/sajuCalculator';
import { getBasicInterpretation, getDetailedInterpretation } from '../services/fortuneService';
import { useProfileStore } from '../store/useProfileStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../engine/gyeokguk';
import { stemToHanja, zhiToHanja } from '../lib/character';
import styles from './SajuResultPage.module.css';

const StemCell = ({ gan }: { gan: string }) => (
  <span className={styles.stemCell}>
    <span className={styles.pillarHangul}>{gan}</span>
    <span className={styles.pillarHanja}>{stemToHanja(gan)}</span>
  </span>
);

const BranchCell = ({ zhi }: { zhi: string }) => (
  <span className={styles.branchCell}>
    <span className={styles.pillarHanja}>{zhiToHanja(zhi)}</span>
    <span className={styles.pillarHangul}>{zhi}</span>
  </span>
);

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


const ELEMENT_COLORS: Record<string, string> = {
  '목': '#34D399',
  '화': '#F43F5E',
  '토': '#F59E0B',
  '금': '#CBD5E1',
  '수': '#3B82F6'
};

const ELEMENT_ORDER = ['목', '화', '토', '금', '수'] as const;
const ELEMENT_HANJA: Record<string, string> = {
  '목': '木', '화': '火', '토': '土', '금': '金', '수': '水',
};
// 상생: 木→火→土→金→水→木 (인접 꼭짓점)
const SHENG: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]];
// 상극: 木剋土, 土剋水, 水剋火, 火剋金, 金剋木 (한 칸 건너뛴 꼭짓점)
const KE: Array<[number, number]> = [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]];

function ElementPentagon({ percents }: { percents: Record<string, number> }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.3;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleFor(i)),
    y: cy + r * Math.sin(angleFor(i)),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolys = gridLevels.map((lv) =>
    ELEMENT_ORDER.map((_, i) => {
      const p = pt(i, rMax * lv);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ')
  );

  const maxPct = Math.max(...ELEMENT_ORDER.map((e) => percents[e] ?? 0), 1);
  const scale = 1 / Math.max(maxPct, 20) * 100;

  const dataPoints = ELEMENT_ORDER.map((el, i) => {
    const v = percents[el] ?? 0;
    const r = rMax * Math.min(1, (v / 100) * scale);
    return pt(i, r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // 상생 — 오각형 테두리 (인접 꼭짓점 직선, 점선 처리)
  const shengArcD = (a: number, b: number) => {
    const pa = pt(a, rMax);
    const pb = pt(b, rMax);
    return `M ${pa.x.toFixed(1)} ${pa.y.toFixed(1)} L ${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`;
  };

  // 상극 라인 — 내부 직선 (양 끝 안쪽으로 당겨 꼭짓점 닷과 겹치지 않게)
  const keLineD = (a: number, b: number) => {
    const pa = pt(a, rMax - 10);
    const pb = pt(b, rMax - 10);
    return `M ${pa.x.toFixed(1)} ${pa.y.toFixed(1)} L ${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`;
  };

  return (
    <div className={styles.pentagonWrap}>
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.pentagonSvg}>
        <defs>
          <radialGradient id="pentagonFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,92,252,0.35)" />
            <stop offset="100%" stopColor="rgba(124,92,252,0.08)" />
          </radialGradient>
          <marker id="shengHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#34D399" opacity="0.9" />
          </marker>
          <marker id="keHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#F43F5E" opacity="0.9" />
          </marker>
        </defs>

        {/* 그리드 오각형 */}
        {gridPolys.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={1}
            strokeDasharray={i === gridPolys.length - 1 ? '0' : '3 3'}
            opacity={0.5}
          />
        ))}
        {/* 축 라인 */}
        {ELEMENT_ORDER.map((_, i) => {
          const p = pt(i, rMax);
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke="var(--border-subtle)" strokeWidth={1} opacity={0.3}
            />
          );
        })}

        {/* 상극 — 내부 펜타그램 (데이터 폴리곤 아래) */}
        {KE.map(([a, b], i) => (
          <motion.path
            key={`ke-${i}`}
            d={keLineD(a, b)}
            stroke="#F43F5E"
            strokeWidth={1}
            fill="none"
            strokeDasharray="3 3"
            opacity={0.42}
            markerEnd="url(#keHead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.42 }}
            transition={{ duration: 0.7, delay: 1.1 + i * 0.1 }}
          />
        ))}

        {/* 데이터 폴리곤 */}
        <motion.polygon
          points={dataPolygon}
          fill="url(#pentagonFill)"
          stroke="rgba(124,92,252,0.85)"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* 상생 — 오각형 테두리(점선) */}
        {SHENG.map(([a, b], i) => (
          <motion.path
            key={`sheng-${i}`}
            d={shengArcD(a, b)}
            stroke="#34D399"
            strokeWidth={1.5}
            fill="none"
            opacity={0.7}
            strokeLinecap="round"
            strokeDasharray="4 4"
            markerEnd="url(#shengHead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 0.6, delay: 0.9 + i * 0.1 }}
          />
        ))}

        {/* 데이터 꼭짓점 — 반짝이는 할로 + 코어 */}
        {dataPoints.map((p, i) => {
          const color = ELEMENT_COLORS[ELEMENT_ORDER[i]];
          return (
            <g key={i}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={8}
                fill={color}
                initial={{ opacity: 0 }}
                animate={{ scale: [1, 1.9, 1], opacity: [0.35, 0, 0.35] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.6 + i * 0.35,
                }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              />
              <motion.circle
                cx={p.x - 1.4}
                cy={p.y - 1.4}
                r={1.1}
                fill="#ffffff"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.8 + i * 0.4,
                }}
              />
            </g>
          );
        })}

        {/* 라벨 — 한자 */}
        {ELEMENT_ORDER.map((el, i) => {
          const lp = pt(i, rMax + 26);
          return (
            <text
              key={el}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={18}
              fontWeight={700}
              fill={ELEMENT_COLORS[el]}
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {ELEMENT_HANJA[el]}
            </text>
          );
        })}
      </svg>

      {/* 생·극 범례 */}
      <div className={styles.pentagonKey}>
        <span className={styles.pentagonKeyItem}>
          <span
            className={styles.pentagonKeySwatch}
            style={{ backgroundColor: '#34D399', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 4px)' }}
          />
          상생
        </span>
        <span className={styles.pentagonKeyItem}>
          <span
            className={styles.pentagonKeySwatch}
            style={{ backgroundColor: '#F43F5E', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)' }}
          />
          상극
        </span>
      </div>

      {/* 하단 비커 */}
      <div className={styles.pentagonLegend}>
        {ELEMENT_ORDER.map((el, i) => (
          <div key={el} className={styles.pentagonLegendItem}>
            <ElementBeaker pct={percents[el] ?? 0} color={ELEMENT_COLORS[el]} />
            <span className={styles.pentagonLegendLabel} style={{ color: ELEMENT_COLORS[el] }}>
              {ELEMENT_HANJA[el]}
            </span>
            <motion.span
              className={styles.pentagonLegendValue}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <CountUp to={percents[el] ?? 0} />%
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ElementBeaker({ pct, color }: { pct: number; color: string }) {
  const W = 72;
  const H = 56;
  const level = Math.min(100, Math.max(0, pct));
  const empty = level === 0;
  const surfaceY = H - (H * level) / 100;
  const amp = 2.6;

  const buildWave = (phase: number) => {
    const step = W / 12;
    let d = `M ${-W} ${surfaceY}`;
    for (let x = 0; x <= 2 * W; x += step) {
      const y = surfaceY + Math.sin((x / W) * Math.PI * 2 + phase) * amp;
      d += ` L ${x - W} ${y.toFixed(2)}`;
    }
    d += ` L ${W} ${H} L ${-W} ${H} Z`;
    return d;
  };

  const clipId = `bk-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className={styles.beaker}>
      <defs>
        <clipPath id={clipId}>
          <rect x="1" y="1" width={W - 2} height={H - 2} rx="6" />
        </clipPath>
        <linearGradient id={`${clipId}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width={W - 2} height={H - 2} rx="6" fill="rgba(20,12,38,0.55)" />
      {!empty && (
        <g clipPath={`url(#${clipId})`}>
          <motion.path
            d={buildWave(0)}
            fill={color}
            opacity={0.55}
            initial={{ x: 0 }}
            animate={{ x: W }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d={buildWave(Math.PI)}
            fill={color}
            opacity={0.9}
            initial={{ x: W }}
            animate={{ x: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <rect x="0" y="0" width={W} height={H} fill={`url(#${clipId}-shine)`} opacity={0.4} />
        </g>
      )}
      <rect
        x="0.5"
        y="0.5"
        width={W - 1}
        height={H - 1}
        rx="6"
        fill="none"
        stroke="var(--border-subtle)"
      />
    </svg>
  );
}

function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{v}</>;
}

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

          {/* 1. 사주 원국 */}
          <div className={styles.section}>
            <h2>사주 원국 (만세력)</h2>
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
                  {result.hourUnknown ? '?' : <StemCell gan={pillars.hour.gan} />}
                </span>
                <span style={{ color: ELEMENT_COLORS[pillars.day.ganElement] }}><StemCell gan={pillars.day.gan} /></span>
                <span style={{ color: ELEMENT_COLORS[pillars.month.ganElement] }}><StemCell gan={pillars.month.gan} /></span>
                <span style={{ color: ELEMENT_COLORS[pillars.year.ganElement] }}><StemCell gan={pillars.year.gan} /></span>
              </div>
              <div className={`${styles.pillarsRow} ${styles.branchRow}`}>
                <span className={styles.label}>지지</span>
                <span
                  className={result.hourUnknown ? styles.hourUnknownCell : ''}
                  style={result.hourUnknown ? undefined : { color: ELEMENT_COLORS[pillars.hour.zhiElement] }}
                >
                  {result.hourUnknown ? '?' : <BranchCell zhi={pillars.hour.zhi} />}
                </span>
                <span style={{ color: ELEMENT_COLORS[pillars.day.zhiElement] }}><BranchCell zhi={pillars.day.zhi} /></span>
                <span style={{ color: ELEMENT_COLORS[pillars.month.zhiElement] }}><BranchCell zhi={pillars.month.zhi} /></span>
                <span style={{ color: ELEMENT_COLORS[pillars.year.zhiElement] }}><BranchCell zhi={pillars.year.zhi} /></span>
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

          {/* 2. 사주 관계 — 천간·지지 신살과 길성 */}
          {(interactions.length > 0 || sinSals.length > 0) && (
            <div className={styles.section}>
              <h2>사주 관계 · 천간지지 신살과 길성</h2>

              {interactions.length > 0 && (
                <>
                  <div className={styles.subheading}>합충형파해</div>
                  <div className={styles.interactionList}>
                    {interactions.map((inter, idx) => (
                      <div key={`i-${idx}`} className={styles.interactionItem} data-type={inter.type}>
                        <span className={styles.interType}>{inter.type}</span>
                        <span className={styles.interDesc}>{inter.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {sinSals.length > 0 && (
                <>
                  <div className={styles.subheading} style={{ marginTop: 16 }}>신살 · 길성</div>
                  <div className={styles.sinsalList}>
                    {sinSals.map((sinsal, idx) => (
                      <div key={`s-${idx}`} className={styles.sinsalItem} data-type={sinsal.type}>
                        <span className={styles.sinsalName}>{sinsal.name}</span>
                        <span className={styles.sinsalDesc}>{sinsal.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className={styles.sectionHint}>
                합·충·형·파·해는 천간과 지지 사이의 기운이 서로 끌어당기거나 부딪히는 방식이에요.
                신살과 길성은 특정 관계가 만들어내는 특수한 성격·사건의 단서예요.
              </p>
            </div>
          )}

          {/* 3. 오행과 십성 */}
          <div className={styles.section}>
            <h2>오행과 십성</h2>

            <div className={styles.subheading}>오행 분포</div>
            <ElementPentagon percents={elementPercent as unknown as Record<string, number>} />

            <div className={styles.subheading} style={{ marginTop: 20 }}>십성 분포 (十星)</div>
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
              오행은 내 사주에 깃든 자연의 기운 비율이고, 십성은 일간을 기준으로 다른 간지가 어떤 역할(관성·재성·인성 등)을 하는지 보여줘요.
            </p>
          </div>

          {/* 4. 신강신약 */}
          <div className={styles.section}>
            <h2>신강신약</h2>

            <div className={styles.strengthBox}>
              <div className={styles.strengthBadge} data-strong={result.isStrong}>
                {result.isStrong ? '신강' : '신약'} ({result.strengthScore}점)
              </div>
              <p>{result.strengthAnalysis}</p>
            </div>

            <div className={styles.subheading} style={{ marginTop: 16 }}>용신 · 희신 · 기신</div>
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

            {gyeokguk && (
              <>
                <div className={styles.subheading} style={{ marginTop: 16 }}>격국 (格局)</div>
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
              </>
            )}

            <p className={styles.sectionHint}>
              신강·신약은 내 일간이 얼마나 힘 있게 버티고 있는지 판정한 결과예요. 그에 따라 필요한 용신과 주된 성격 유형(격국)이 결정돼요.
            </p>
          </div>

          {/* 5. 대운수 */}
          <div className={styles.section}>
            <h2>대운수</h2>
            <p className={styles.subInfo}>대운 시작: {result.daeWoonStartAge}세</p>

            <div className={styles.subheading}>대운 (10년 주기)</div>
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

            <div className={styles.subheading} style={{ marginTop: 16 }}>세운 (연운)</div>
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
