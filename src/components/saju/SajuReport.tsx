'use client';

/**
 * 사주 리포트 — 사주원국 → 사주관계 → 오행십성 → 신강신약 → 대운수
 * 정통사주(SajuResultPage) 와 만세력(ManseryeokPage) 두 곳에서 동일 렌더링 사용.
 * (AI 풀이 섹션은 정통사주 페이지에만 붙임)
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SajuResult, TEN_GODS_MAP, type Interaction, type SinSal } from '../../utils/sajuCalculator';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../../engine/gyeokguk';
import { stemToHanja, zhiToHanja } from '../../lib/character';
import styles from '../../pages/SajuResultPage.module.css';

const SectionHelp = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.sectionHelpWrap}>
      <button
        type="button"
        className={styles.sectionHelpBtn}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="섹션 설명 보기"
      >
        <span aria-hidden="true">※</span>
        <span>설명</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className={styles.sectionHelpBackdrop}
            onClick={() => setOpen(false)}
            aria-label="설명 닫기"
            tabIndex={-1}
          />
          <div className={styles.sectionHelpPopover} role="dialog" aria-modal="false">
            <button
              type="button"
              className={styles.sectionHelpClose}
              onClick={() => setOpen(false)}
              aria-label="설명 닫기"
            >
              ×
            </button>
            <p>{text}</p>
          </div>
        </>
      )}
    </span>
  );
};

const SECTION_HELP_TEXT: Record<string, string> = {
  wonguk: '태어난 해·달·날·시의 천간과 지지로 구성된 네 기둥(年·月·日·時)이에요. 팔자(八字) 8글자가 운명의 기본 구조를 만들고, 지장간·12운성·십성으로 그 힘과 역할을 읽어요.',
  relation: '사주 여덟 글자 사이의 상호작용이에요. 합(결합)·충(충돌)·형(긴장)·파(깨짐)·해(해침) 같은 관계와, 특정 별자리처럼 작용하는 신살(神殺)·길성(吉星)이 인생의 주요 포인트를 드러내요.',
  ohaeng: '오행(목·화·토·금·수)은 사주에 깃든 자연 기운의 비율이고, 십성은 일간을 기준으로 다른 간지가 맡는 역할(비겁·식상·재성·관성·인성)을 뜻해요.',
  strength: '일간(日干·자기 자신)이 얼마나 힘 있게 서 있는지 판정한 결과예요. 득령(월지 지원)·득지(일지 지원)·득세(전체 지원)의 3단계로 체크해 매우 신강부터 매우 신약까지 5단계로 판별해요.',
  daewoon: '10년 단위로 바뀌는 큰 흐름의 운이에요. 대운이 시작되는 나이부터 각 구간이 어떤 오행·십성 기운을 가져오는지 보면 인생의 변동 시기를 읽을 수 있어요.',
};

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

  const stems = [
    result.pillars.year.gan,
    result.pillars.month.gan,
    result.pillars.hour.gan,
  ];
  stems.forEach(gan => {
    const s = map[gan];
    if (s && counts[s] !== undefined) counts[s] += 1;
  });

  const branches = [
    result.pillars.year.hiddenStems,
    result.pillars.month.hiddenStems,
    result.pillars.day.hiddenStems,
    result.pillars.hour.hiddenStems,
  ];
  branches.forEach(hidden => {
    hidden.forEach(gan => {
      const s = map[gan];
      if (s && counts[s] !== undefined) counts[s] += 0.5;
    });
  });

  Object.keys(counts).forEach(k => { counts[k] = Math.round(counts[k] * 2) / 2; });

  return counts;
}

const ELEMENT_COLORS: Record<string, string> = {
  '목': '#34D399',
  '화': '#F43F5E',
  '토': '#F59E0B',
  '금': '#CBD5E1',
  '수': '#3B82F6',
};

// ============== 오행 크리스털 다이아몬드 ==============
const ELEMENT_GEMS = [
  { key: '목', hanja: '木', color: '#4ADE80' },
  { key: '화', hanja: '火', color: '#F87171' },
  { key: '토', hanja: '土', color: '#FBBF24' },
  { key: '금', hanja: '金', color: '#E5E7EB' },
  { key: '수', hanja: '水', color: '#60A5FA' },
] as const;

const GEM_PATH = 'M 40 4 L 72 24 L 72 68 L 40 96 L 8 68 L 8 24 Z';

function Crystal({ hanja, color, percent, delay, idSuffix }: {
  hanja: string; color: string; percent: number; delay: number; idSuffix: string;
}) {
  const clipId = `saju-crystal-clip-${idSuffix}`;
  const gradId = `saju-crystal-grad-${idSuffix}`;
  const pct = Math.max(0, Math.min(100, percent));
  const gemTop = 4, gemBottom = 96;
  const liquidTop = gemBottom - (gemBottom - gemTop) * (pct / 100);
  const waveAmp = 3.5;
  const buildWavePath = (topY: number) => {
    const pts: string[] = [`M 0 ${topY}`];
    for (let x = 0; x <= 160; x += 10) {
      const y = topY + Math.sin((x / 160) * Math.PI * 4) * waveAmp;
      pts.push(`L ${x} ${y.toFixed(2)}`);
    }
    pts.push(`L 160 ${gemBottom}`, `L 0 ${gemBottom}`, 'Z');
    return pts.join(' ');
  };

  return (
    <motion.g
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={GEM_PATH} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d={GEM_PATH} fill="rgba(255,255,255,0.03)" stroke={`${color}55`} strokeWidth="1" />
      <g clipPath={`url(#${clipId})`}>
        <motion.path
          d={buildWavePath(liquidTop)}
          fill={`url(#${gradId})`}
          animate={{ x: [-80, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
      </g>
      <path d={GEM_PATH} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M 40 4 L 40 24 M 8 24 L 72 24 M 8 68 L 72 68 M 40 68 L 40 96"
        stroke={`${color}33`} strokeWidth="0.6" fill="none"
      />
      <text x="40" y="50" textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="20" fontWeight="bold"
            style={{ fontFamily: 'var(--font-serif)' }}>
        {hanja}
      </text>
      <text x="40" y="72" textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="10" fontWeight="600" opacity="0.9">
        {pct}%
      </text>
    </motion.g>
  );
}

function ElementCrystalPentagon({ counts }: { counts: Record<'목'|'화'|'토'|'금'|'수', number> }) {
  const W = 340, H = 320;
  const cx = W / 2, cy = H / 2 + 8;
  const R = 112;
  const total = ELEMENT_GEMS.reduce((s, e) => s + (counts[e.key] ?? 0), 0) || 1;

  const pentagonPath = (scale: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const x = cx + R * scale * Math.cos(a);
      const y = cy + R * scale * Math.sin(a);
      pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ') + ' Z';
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.crystalPentagonSvg}>
      {[1.32, 1.0, 0.5].map((scale, i) => (
        <path
          key={i}
          d={pentagonPath(scale)}
          fill="none"
          stroke={`rgba(255,255,255,${0.04 + i * 0.02})`}
          strokeWidth={1}
          strokeDasharray={i === 0 ? '4 4' : undefined}
        />
      ))}
      {ELEMENT_GEMS.map((gem, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const gx = cx + R * Math.cos(a) - 40;
        const gy = cy + R * Math.sin(a) - 50;
        const pct = Math.round(((counts[gem.key] ?? 0) / total) * 100);
        return (
          <g key={gem.key} transform={`translate(${gx}, ${gy})`}>
            <Crystal
              hanja={gem.hanja}
              color={gem.color}
              percent={pct}
              delay={0.1 + i * 0.08}
              idSuffix={gem.key}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ============================================
// 사주 관계 보드
// ============================================

type PillarCol = 0 | 1 | 2 | 3;
type PillarRow = 'stem' | 'branch';

const INTERACTION_COLORS: Record<Interaction['type'], string> = {
  '합': '#34D399',
  '충': '#F43F5E',
  '형': '#F59E0B',
  '파': '#60A5FA',
  '해': '#A78BFA',
};

const SINSAL_TYPE_COLORS: Record<SinSal['type'], string> = {
  good: '#34D399',
  bad: '#F43F5E',
  neutral: '#F59E0B',
};

function elementPosToCell(el: string): { col: PillarCol; row: PillarRow } | null {
  const pillarChar = el[0];
  const kindChar = el[1];
  const colMap: Record<string, PillarCol> = { '시': 0, '일': 1, '월': 2, '년': 3 };
  const col = colMap[pillarChar];
  if (col == null) return null;
  if (kindChar !== '간' && kindChar !== '지') return null;
  return { col, row: kindChar === '간' ? 'stem' : 'branch' };
}

function PillarsRelationBoard({
  pillars,
  interactions,
  hourUnknown,
}: {
  pillars: SajuResult['pillars'];
  interactions: Interaction[];
  hourUnknown: boolean;
}) {
  const columns = [
    { col: 0 as PillarCol, pillar: pillars.hour, unknown: hourUnknown },
    { col: 1 as PillarCol, pillar: pillars.day, unknown: false },
    { col: 2 as PillarCol, pillar: pillars.month, unknown: false },
    { col: 3 as PillarCol, pillar: pillars.year, unknown: false },
  ];

  const VB_W = 400;
  const VB_H = 260;
  const colX = (c: PillarCol) => 50 + c * 100;
  const stemY = 85;
  const branchY = 175;
  const stemTopEdge = 40;
  const branchBotEdge = 220;
  const stemBusBase = 18;
  const branchBusBase = 242;
  const busStep = 10;
  const cellY = (row: PillarRow) => (row === 'stem' ? stemY : branchY);

  const edges = interactions
    .map((it, idx) => {
      const cells = it.elements
        .map(elementPosToCell)
        .filter((c): c is { col: PillarCol; row: PillarRow } => c != null);
      const unique = cells.filter(
        (c, i, arr) => arr.findIndex(o => o.col === c.col && o.row === c.row) === i
      );
      return { it, cells: unique, idx };
    })
    .filter(e => e.cells.length >= 2);

  type Arc = {
    key: string;
    color: string;
    type: Interaction['type'];
    desc: string;
    d: string;
    labelX: number;
    labelY: number;
  };
  const arcs: Arc[] = [];

  let stemStack = 0;
  let branchStack = 0;
  let crossStack = 0;

  edges.forEach(({ it, cells, idx }) => {
    const color = INTERACTION_COLORS[it.type];
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i];
        const b = cells[j];
        const sameRow = a.row === b.row;
        const ax = colX(a.col);
        const bx = colX(b.col);
        const ay = cellY(a.row);
        const by = cellY(b.row);

        let d: string;
        let labelX: number;
        let labelY: number;

        if (sameRow && a.row === 'stem') {
          const busY = stemBusBase - stemStack * busStep;
          d = `M ${ax} ${stemTopEdge} L ${ax} ${busY} L ${bx} ${busY} L ${bx} ${stemTopEdge}`;
          labelX = (ax + bx) / 2;
          labelY = busY;
          stemStack++;
        } else if (sameRow && a.row === 'branch') {
          const busY = branchBusBase + branchStack * busStep;
          d = `M ${ax} ${branchBotEdge} L ${ax} ${busY} L ${bx} ${busY} L ${bx} ${branchBotEdge}`;
          labelX = (ax + bx) / 2;
          labelY = busY;
          branchStack++;
        } else {
          d = `M ${ax} ${ay} L ${bx} ${by}`;
          const midY = (stemY + branchY) / 2;
          const midX = (ax + bx) / 2;
          const sameCol = a.col === b.col;
          const sign = crossStack % 2 === 0 ? -1 : 1;
          const mag = sameCol
            ? 30 + Math.floor(crossStack / 2) * 16
            : Math.floor(crossStack / 2) * 18;
          labelX = midX + sign * mag;
          labelY = midY;
          crossStack++;
        }

        arcs.push({
          key: `${idx}-${i}-${j}`,
          color,
          type: it.type,
          desc: it.description,
          d,
          labelX,
          labelY,
        });
      }
    }
  });

  return (
    <div className={styles.relationBoardWrap}>
      <div className={styles.pillarsTable}>
        <div className={styles.pillarsHeader}>
          <span aria-hidden="true" />
          <span>시주</span>
          <span>일주</span>
          <span>월주</span>
          <span>년주</span>
        </div>
        <div className={styles.relationDataWrap}>
          <div className={styles.relationSpacerTop} aria-hidden="true" />
          <div className={`${styles.pillarsRow} ${styles.stemRow}`}>
            <span className={styles.label}>천간</span>
            {columns.map(({ col, pillar, unknown }) => (
              <span
                key={`rs-${col}`}
                className={unknown ? styles.hourUnknownCell : ''}
                style={!unknown ? { color: ELEMENT_COLORS[pillar.ganElement] } : undefined}
              >
                {unknown ? '?' : <StemCell gan={pillar.gan} />}
              </span>
            ))}
          </div>
          <div className={`${styles.pillarsRow} ${styles.branchRow}`}>
            <span className={styles.label}>지지</span>
            {columns.map(({ col, pillar, unknown }) => (
              <span
                key={`rb-${col}`}
                className={unknown ? styles.hourUnknownCell : ''}
                style={!unknown ? { color: ELEMENT_COLORS[pillar.zhiElement] } : undefined}
              >
                {unknown ? '?' : <BranchCell zhi={pillar.zhi} />}
              </span>
            ))}
          </div>
          <div className={styles.relationSpacerBottom} aria-hidden="true" />
          <svg
            className={styles.relationOverlay}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {arcs.map(a => (
              <motion.path
                key={a.key}
                d={a.d}
                stroke={a.color}
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={a.type === '충' ? '4 3' : '0'}
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.4 }}
              />
            ))}
          </svg>
          <div className={styles.relationLabels} aria-hidden="true">
            {arcs.map(a => (
              <span
                key={`lab-${a.key}`}
                className={styles.relationLabelBadge}
                style={{
                  left: `${(a.labelX / VB_W) * 100}%`,
                  top: `${(a.labelY / VB_H) * 100}%`,
                  color: a.color,
                  borderColor: a.color,
                }}
              >
                {a.type}
              </span>
            ))}
          </div>
        </div>
      </div>
      {interactions.length > 0 && (
        <ul className={styles.relationLegend}>
          {interactions.map((it, i) => (
            <li key={i} className={styles.relationLegendItem}>
              <span
                className={styles.relationLegendBadge}
                style={{ color: INTERACTION_COLORS[it.type], borderColor: INTERACTION_COLORS[it.type] }}
              >
                {it.type}
              </span>
              <span className={styles.relationLegendDesc}>{it.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SinSalBoard({
  pillars,
  sinSals,
  hourUnknown,
}: {
  pillars: SajuResult['pillars'];
  sinSals: SinSal[];
  hourUnknown: boolean;
}) {
  const columns = [
    { col: 0 as PillarCol, pillar: pillars.hour, unknown: hourUnknown },
    { col: 1 as PillarCol, pillar: pillars.day, unknown: false },
    { col: 2 as PillarCol, pillar: pillars.month, unknown: false },
    { col: 3 as PillarCol, pillar: pillars.year, unknown: false },
  ];

  const byCol: Record<PillarCol, SinSal[]> = { 0: [], 1: [], 2: [], 3: [] };
  sinSals.forEach(s => {
    const unique = Array.from(new Set(s.pillars)) as PillarCol[];
    unique.forEach(c => {
      if (c === 0 || c === 1 || c === 2 || c === 3) {
        const exists = byCol[c].some(x => x.name === s.name);
        if (!exists) byCol[c].push(s);
      }
    });
  });

  return (
    <div className={styles.sinsalBoardWrap}>
      <div className={styles.pillarsTable}>
        <div className={styles.pillarsHeader}>
          <span aria-hidden="true" />
          <span>시주</span>
          <span>일주</span>
          <span>월주</span>
          <span>년주</span>
        </div>
        <div className={`${styles.pillarsRow} ${styles.stemRow}`}>
          <span className={styles.label}>천간</span>
          {columns.map(({ col, pillar, unknown }) => (
            <span
              key={`ss-${col}`}
              className={unknown ? styles.hourUnknownCell : ''}
              style={!unknown ? { color: ELEMENT_COLORS[pillar.ganElement] } : undefined}
            >
              {unknown ? '?' : <StemCell gan={pillar.gan} />}
            </span>
          ))}
        </div>
        <div className={`${styles.pillarsRow} ${styles.branchRow}`}>
          <span className={styles.label}>지지</span>
          {columns.map(({ col, pillar, unknown }) => (
            <span
              key={`sb-${col}`}
              className={unknown ? styles.hourUnknownCell : ''}
              style={!unknown ? { color: ELEMENT_COLORS[pillar.zhiElement] } : undefined}
            >
              {unknown ? '?' : <BranchCell zhi={pillar.zhi} />}
            </span>
          ))}
        </div>
        <div className={`${styles.pillarsRow} ${styles.sinsalRow}`}>
          <span className={styles.label}>신살</span>
          {columns.map(({ col }) => (
            <span key={`st-${col}`} className={styles.sinsalTagCell}>
              {byCol[col].length === 0 ? (
                <span className={styles.sinsalTagEmpty}>—</span>
              ) : (
                byCol[col].map(s => (
                  <span
                    key={s.name}
                    className={styles.sinsalTag}
                    style={{ color: SINSAL_TYPE_COLORS[s.type], borderColor: SINSAL_TYPE_COLORS[s.type] }}
                    title={s.description}
                  >
                    {s.name}
                  </span>
                ))
              )}
            </span>
          ))}
        </div>
      </div>
      {sinSals.length > 0 && (
        <ul className={styles.sinsalDescList}>
          {sinSals.map((s, i) => (
            <li key={`${s.name}-${i}`} className={styles.sinsalDescItem}>
              <span
                className={styles.sinsalDescName}
                style={{ color: SINSAL_TYPE_COLORS[s.type] }}
              >
                {s.name}
              </span>
              <span className={styles.sinsalDescText}>{s.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SajuReport({ result }: { result: SajuResult }) {
  const { pillars, elementCount, daeWoon, seWoon, sinSals, interactions } = result;

  const gyeokguk = useMemo(() => determineGyeokguk(result), [result]);
  const gyeokgukStatus = useMemo(
    () => analyzeGyeokgukStatus(result, gyeokguk),
    [result, gyeokguk]
  );
  const sipseongDist = useMemo(() => computeSipseongDistribution(result), [result]);

  return (
    <>
      {/* 1. 사주 원국 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>사주 원국 (만세력)</h2>
          <SectionHelp text={SECTION_HELP_TEXT.wonguk} />
        </div>
        <div className={styles.pillarsTable}>
          <div className={styles.pillarsHeader}>
            <span aria-hidden="true" />
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

      {/* 2. 사주 관계 */}
      {(interactions.length > 0 || sinSals.length > 0) && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>사주 관계</h2>
            <SectionHelp text={SECTION_HELP_TEXT.relation} />
          </div>

          <div className={styles.subheading}>천간과 지지</div>
          {interactions.length > 0 ? (
            <PillarsRelationBoard
              pillars={pillars}
              interactions={interactions}
              hourUnknown={result.hourUnknown}
            />
          ) : (
            <p className={styles.sectionHint} style={{ margin: '6px 0 14px' }}>
              천간·지지 간 합·충·형·파·해 관계가 두드러지지 않아요.
            </p>
          )}

          <div className={styles.subheading} style={{ marginTop: 18 }}>신살과 길성</div>
          {sinSals.length > 0 ? (
            <SinSalBoard
              pillars={pillars}
              sinSals={sinSals}
              hourUnknown={result.hourUnknown}
            />
          ) : (
            <p className={styles.sectionHint} style={{ margin: '6px 0 0' }}>
              눈에 띄는 신살·길성이 없어요.
            </p>
          )}

          <p className={styles.sectionHint} style={{ marginTop: 14 }}>
            합·충·형·파·해는 천간과 지지 사이의 기운이 끌어당기거나 부딪히는 방식이에요.
            신살과 길성은 특정 기둥에서 발동하는 특수한 성격·사건의 단서예요.
          </p>
        </div>
      )}

      {/* 3. 오행과 십성 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>오행과 십성</h2>
          <SectionHelp text={SECTION_HELP_TEXT.ohaeng} />
        </div>

        <div className={styles.ohaengHeader}>
          <span className={styles.subheading}>오행 분포</span>
          <span className={styles.ohaengMeta}>
            {result.isStrong ? '신강' : '신약'} · 용신 {result.yongSinElement}
          </span>
        </div>
        <div className={styles.crystalPentagonWrap}>
          <ElementCrystalPentagon counts={elementCount as Record<'목'|'화'|'토'|'금'|'수', number>} />
        </div>

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
        <div className={styles.sectionHeader}>
          <h2>신강신약</h2>
          <SectionHelp text={SECTION_HELP_TEXT.strength} />
        </div>

        <div className={styles.strengthBox}>
          <div className={styles.strengthBadge} data-strong={result.isStrong}>
            {result.strengthStatus} ({result.strengthScore}점)
          </div>
          <div className={styles.strengthTrio}>
            <span className={styles.trioChip} data-on={result.deukRyeong}>
              <span className={styles.trioName}>득령</span>
              <span className={styles.trioValue}>{result.deukRyeong ? '성립' : '불성립'}</span>
            </span>
            <span className={styles.trioChip} data-on={result.deukJi}>
              <span className={styles.trioName}>득지</span>
              <span className={styles.trioValue}>{result.deukJi ? '성립' : '불성립'}</span>
            </span>
            <span className={styles.trioChip} data-on={result.deukSe}>
              <span className={styles.trioName}>득세</span>
              <span className={styles.trioValue}>{result.deukSe ? '성립' : '불성립'}</span>
            </span>
          </div>
          <p>{result.strengthAnalysis}</p>
          <div className={styles.strengthDetail}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>강화점(비겁·인성·득령)</span>
              <span className={styles.detailValue}>{result.strengthDetail.supportTotal.toFixed(1)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>약화점(식상·재성·관성)</span>
              <span className={styles.detailValue}>{result.strengthDetail.weakenTotal.toFixed(1)}</span>
            </div>
            <div className={styles.detailBreakdown}>
              <span>비겁 {result.strengthDetail.bijeopScore.toFixed(1)}</span>
              <span>인성 {result.strengthDetail.inseongScore.toFixed(1)}</span>
              <span>식상 {result.strengthDetail.sikSangPenalty.toFixed(1)}</span>
              <span>재성 {result.strengthDetail.jaeseongPenalty.toFixed(1)}</span>
              <span>관성 {result.strengthDetail.gwanseongPenalty.toFixed(1)}</span>
            </div>
          </div>
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
        <div className={styles.sectionHeader}>
          <h2>대운수</h2>
          <SectionHelp text={SECTION_HELP_TEXT.daewoon} />
        </div>
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
    </>
  );
}
