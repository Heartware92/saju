'use client';

/**
 * 대표 프로필 기반 상세 만세력 페이지
 * - 홈의 간단 만세력에서 "만세력 보기" 버튼으로 진입
 * - 4기둥(시·일·월·년) × 행(십신/천간/지지/지장간/12운성/신살/합충/대운/세운)
 * - 모든 데이터는 대표 프로필의 birth_date/birth_time/gender 로 client-side 계산
 *   (DB 에는 원국(原局) 원자료만 저장, 계산 결과는 저장하지 않음)
 */

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import {
  TEN_GODS_MAP,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  type Pillar,
} from '../utils/sajuCalculator';
import { computeSajuFromProfile } from '../utils/profileSaju';
import {
  stemToHanja,
  zhiToHanja,
  ELEMENT_CELL_COLORS,
  type Element,
} from '../lib/character';

const PILLAR_LABELS = [
  { key: 'hour' as const,  label: '시주' },
  { key: 'day' as const,   label: '일주' },
  { key: 'month' as const, label: '월주' },
  { key: 'year' as const,  label: '년주' },
];

function ElementCell({
  element,
  text,
  size = 'lg',
}: {
  element: Element | '';
  text: string;
  size?: 'lg' | 'md' | 'sm';
}) {
  const colors = element
    ? ELEMENT_CELL_COLORS[element]
    : { bg: 'rgba(255,255,255,0.06)', fg: 'var(--text-secondary)' };
  // 한자가 짓눌려 보이지 않도록 cell 자체를 정사각형(aspect-square)로 잡고 폰트를 키운다
  const fontPx = size === 'lg' ? 32 : size === 'md' ? 24 : 18;
  return (
    <div
      className="w-full aspect-square rounded-lg flex items-center justify-center font-bold"
      style={{
        backgroundColor: colors.bg,
        color: colors.fg,
        fontFamily: 'var(--font-serif)',
        fontSize: fontPx,
        lineHeight: 1,
        letterSpacing: 0,
      }}
    >
      {text}
    </div>
  );
}

function PillarRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[56px_1fr_1fr_1fr_1fr] gap-1.5 items-center py-1.5 ${
        last ? '' : 'border-b border-[var(--border-subtle)]'
      }`}
    >
      <div className="text-[11px] font-semibold text-text-tertiary pl-1">{label}</div>
      {children}
    </div>
  );
}

function tenGodFor(dayGan: string, targetGan: string): string {
  if (!dayGan || !targetGan) return '';
  return TEN_GODS_MAP[dayGan]?.[targetGan] ?? '';
}

// ============== 오행 보석(크리스털) + 리퀴드 웨이브 ==============
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
  const clipId = `crystal-clip-${idSuffix}`;
  const gradId = `crystal-grad-${idSuffix}`;
  const pct = Math.max(0, Math.min(100, percent));
  const gemTop = 4, gemBottom = 96;
  const liquidTop = gemBottom - (gemBottom - gemTop) * (pct / 100);
  // 2배 폭의 사인파 — 애니메이션으로 왼쪽으로 translate 하면 자연스럽게 흘러감
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
      {/* 보석 배경 */}
      <path d={GEM_PATH} fill="rgba(255,255,255,0.03)" stroke={`${color}55`} strokeWidth="1" />
      {/* 리퀴드 웨이브 (클립) */}
      <g clipPath={`url(#${clipId})`}>
        <motion.path
          d={buildWavePath(liquidTop)}
          fill={`url(#${gradId})`}
          animate={{ x: [-80, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
      </g>
      {/* 보석 외곽선 */}
      <path d={GEM_PATH} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      {/* 패싯(면 라인) */}
      <path
        d="M 40 4 L 40 24 M 8 24 L 72 24 M 8 68 L 72 68 M 40 68 L 40 96"
        stroke={`${color}33`} strokeWidth="0.6" fill="none"
      />
      {/* 한자 */}
      <text x="40" y="50" textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="20" fontWeight="bold"
            style={{ fontFamily: 'var(--font-serif)' }}>
        {hanja}
      </text>
      {/* 퍼센트 */}
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

  // 배경 펜타곤 가이드
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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[360px] mx-auto">
      {/* 배경 펜타곤 가이드라인 (3단 동심) */}
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
      {/* 보석 5개 — 각 꼭지점 */}
      {ELEMENT_GEMS.map((gem, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const gx = cx + R * Math.cos(a) - 40; // 80 폭의 절반
        const gy = cy + R * Math.sin(a) - 50; // 100 높이의 절반
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

// ============== 합·충·형·파·해 카드 ==============
const INTERACTION_STYLE: Record<string, { color: string; bg: string; label: string; symbol: 'wave' | 'cross' | 'bolt' | 'split' | 'curve' }> = {
  '합': { color: '#34D399', bg: 'rgba(52,211,153,0.10)', label: '합 · 결속', symbol: 'wave' },
  '충': { color: '#F87171', bg: 'rgba(248,113,113,0.10)', label: '충 · 충돌', symbol: 'cross' },
  '형': { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', label: '형 · 갈등', symbol: 'bolt' },
  '파': { color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', label: '파 · 균열', symbol: 'split' },
  '해': { color: '#FB923C', bg: 'rgba(251,146,60,0.10)', label: '해 · 방해', symbol: 'curve' },
};

function InteractionConnector({ symbol, color }: { symbol: 'wave' | 'cross' | 'bolt' | 'split' | 'curve'; color: string }) {
  const common = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };
  if (symbol === 'wave')
    return <svg width="32" height="14" viewBox="0 0 32 14"><path d="M2 7 Q 8 0, 16 7 T 30 7" {...common} /></svg>;
  if (symbol === 'cross')
    return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 3 L17 17 M17 3 L3 17" {...common} /></svg>;
  if (symbol === 'bolt')
    return <svg width="14" height="20" viewBox="0 0 14 20"><path d="M8 1 L2 11 H7 L4 19" {...common} /></svg>;
  if (symbol === 'split')
    return <svg width="24" height="14" viewBox="0 0 24 14"><path d="M2 7 H10 M14 7 H22 M10 4 V10 M14 4 V10" {...common} /></svg>;
  return <svg width="28" height="14" viewBox="0 0 28 14"><path d="M2 12 C 8 -2, 20 16, 26 2" {...common} /></svg>;
}

function InteractionCard({ it }: { it: { type: '합'|'충'|'형'|'파'|'해'; elements: string[]; description: string } }) {
  const s = INTERACTION_STYLE[it.type] ?? INTERACTION_STYLE['합'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-xl p-3 border flex items-center gap-3"
      style={{ backgroundColor: s.bg, borderColor: `${s.color}55` }}
    >
      {/* 좌측 — 기둥 위치 → 커넥터 → 다음 위치 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {it.elements.map((pos, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="text-[12px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
              style={{ color: s.color, backgroundColor: `${s.color}1f` }}
            >
              {pos}
            </span>
            {i < it.elements.length - 1 && <InteractionConnector symbol={s.symbol} color={s.color} />}
          </div>
        ))}
      </div>
      {/* 우측 — 타입 라벨 */}
      <div className="flex flex-col items-end shrink-0">
        <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.label}</span>
        <span className="text-[10px] text-text-tertiary mt-0.5 text-right max-w-[140px] line-clamp-2">
          {it.description.split(' - ')[1] ?? it.description}
        </span>
      </div>
    </motion.div>
  );
}

// ============== 신살 그룹 ==============
const SINSAL_GROUP: Record<'good'|'bad'|'neutral', { label: string; color: string; bg: string }> = {
  good:    { label: '길신', color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
  bad:     { label: '흉살', color: '#F87171', bg: 'rgba(248,113,113,0.08)' },
  neutral: { label: '특수살', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
};

function SinSalGroup({ type, items }: {
  type: 'good'|'bad'|'neutral';
  items: { name: string; description: string }[];
}) {
  if (items.length === 0) return null;
  const g = SINSAL_GROUP[type];
  return (
    <div
      className="rounded-xl p-3 border"
      style={{ backgroundColor: g.bg, borderColor: `${g.color}40` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
        <span className="text-[12px] font-bold" style={{ color: g.color }}>{g.label}</span>
        <span className="text-[11px] text-text-tertiary">· {items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="rounded-lg border px-2.5 py-1.5"
            style={{ borderColor: `${g.color}55`, backgroundColor: 'rgba(20,12,38,0.4)' }}
            title={s.description}
          >
            <div className="text-[12px] font-bold" style={{ color: g.color }}>{s.name}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5 max-w-[180px]">{s.description}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ManseryeokPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const daeWoonScrollRef = useRef<HTMLDivElement>(null);
  const seWoonScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  // 현재 시점 카드를 가운데로 자동 스크롤
  useEffect(() => {
    const centerCurrent = (container: HTMLDivElement | null) => {
      if (!container) return;
      const target = container.querySelector<HTMLElement>('[data-current="true"]');
      if (!target) return;
      const offset = target.offsetLeft - container.clientWidth / 2 + target.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    };
    // 렌더 직후 한 번
    requestAnimationFrame(() => {
      centerCurrent(daeWoonScrollRef.current);
      centerCurrent(seWoonScrollRef.current);
    });
  });

  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? null,
    [profiles],
  );

  const saju = useMemo(() => {
    if (!primary) return null;
    return computeSajuFromProfile(primary);
  }, [primary]);

  if (!primary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">대표 프로필이 없어요</p>
        <Link
          href="/saju/input"
          className="px-5 py-2.5 rounded-xl bg-cta text-white text-sm font-semibold"
        >
          프로필 등록
        </Link>
      </div>
    );
  }

  if (!saju) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dayGan = saju.dayMaster;
  const ordered: { label: string; pillar: Pillar; unknown: boolean }[] =
    PILLAR_LABELS.map((p) => ({
      label: p.label,
      pillar: saju.pillars[p.key],
      unknown: p.key === 'hour' && saju.hourUnknown,
    }));

  const thisYear = new Date().getFullYear();
  const birthYear = parseInt(primary.birth_date.slice(0, 4), 10);
  const age = thisYear - birthYear + 1; // 한국 나이

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen px-4 pt-4 pb-10"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
          aria-label="뒤로"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center flex-1">
          <h1
            className="text-lg font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            만세력
          </h1>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {primary.name} · 만 {age - 1}세
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* 생년월일 요약 */}
      <div className="rounded-xl p-3.5 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] text-center text-[14px] text-text-secondary">
        {primary.birth_date}
        {primary.birth_time ? ` ${primary.birth_time}` : ' (시간 모름)'}
        {' · '}
        {primary.gender === 'male' ? '남' : '여'}
        {' · '}
        음력 {saju.lunarDateSimple}
      </div>

      {/* 4기둥 × 행 (십성/천간/지지/지장간/12운성/12신살/공망) */}
      <section className="rounded-2xl p-3 mb-5 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        {/* 기둥 헤더 */}
        <div className="grid grid-cols-[56px_1fr_1fr_1fr_1fr] gap-1.5 mb-2">
          <div />
          {ordered.map((c) => (
            <div key={c.label} className="text-center text-[12px] font-semibold text-text-secondary">
              {c.label}
            </div>
          ))}
        </div>

        {/* 십성(천간) */}
        <PillarRow label="십성">
          {ordered.map((c, i) => (
            <div key={i} className="text-center text-[11px] text-text-secondary">
              {c.unknown ? '—' : c.pillar.tenGodGan || '일간'}
            </div>
          ))}
        </PillarRow>

        {/* 천간 */}
        <PillarRow label="천간">
          {ordered.map((c, i) => (
            <ElementCell
              key={i}
              element={c.unknown ? '' : (c.pillar.ganElement as Element)}
              text={c.unknown ? '?' : stemToHanja(c.pillar.gan)}
              size="lg"
            />
          ))}
        </PillarRow>

        {/* 지지 */}
        <PillarRow label="지지">
          {ordered.map((c, i) => (
            <ElementCell
              key={i}
              element={c.unknown ? '' : (c.pillar.zhiElement as Element)}
              text={c.unknown ? '?' : zhiToHanja(c.pillar.zhi)}
              size="lg"
            />
          ))}
        </PillarRow>

        {/* 십성(지지) */}
        <PillarRow label="십성">
          {ordered.map((c, i) => (
            <div key={i} className="text-center text-[11px] text-text-secondary">
              {c.unknown ? '—' : c.pillar.tenGodZhi}
            </div>
          ))}
        </PillarRow>

        {/* 지장간 */}
        <PillarRow label="지장간">
          {ordered.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              {c.unknown || c.pillar.hiddenStems.length === 0 ? (
                <span className="text-[12px] text-text-tertiary">—</span>
              ) : (
                c.pillar.hiddenStems.map((hs, j) => {
                  const el = STEM_ELEMENT[hs] as Element;
                  return (
                    <div key={j} className="flex items-center gap-1 leading-tight">
                      <span
                        className="text-[14px] font-bold"
                        style={{ fontFamily: 'var(--font-serif)', color: ELEMENT_CELL_COLORS[el]?.bg }}
                      >
                        {stemToHanja(hs)}
                      </span>
                      <span className="text-[10px] text-text-tertiary">{tenGodFor(dayGan, hs)}</span>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </PillarRow>

        {/* 12운성 */}
        <PillarRow label="12운성">
          {ordered.map((c, i) => (
            <div key={i} className="text-center text-[11px] text-text-tertiary">
              {c.unknown ? '—' : c.pillar.twelveStage}
            </div>
          ))}
        </PillarRow>

        {/* 12신살 */}
        <PillarRow label="12신살">
          {ordered.map((c, i) => (
            <div key={i} className="text-center text-[11px] text-text-tertiary">
              {c.unknown ? '—' : (c.pillar.sinSal12 || '—')}
            </div>
          ))}
        </PillarRow>

        {/* 공망 */}
        <PillarRow label="공망" last>
          {ordered.map((c, i) => (
            <div key={i} className="text-center text-[11px]">
              {c.unknown ? (
                <span className="text-text-tertiary">—</span>
              ) : c.pillar.isKongmang ? (
                <span className="font-bold text-[#F87171]">공망</span>
              ) : (
                <span className="text-text-tertiary">—</span>
              )}
            </div>
          ))}
        </PillarRow>
      </section>

      {/* 오행 분포 — 펜타곤 레이더 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">오행 분포</span>
          <span className="text-[13px] text-text-secondary">
            {saju.isStrong ? '신강' : '신약'} · 용신 {saju.yongSinElement}
          </span>
        </div>
        <ElementCrystalPentagon counts={saju.elementCount} />
      </section>

      {/* 합·충·형·파·해 — 시각 커넥터 카드 */}
      {saju.interactions.length > 0 && (
        <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
          <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            합·충·형
          </div>
          <div className="space-y-2">
            {saju.interactions.map((it, i) => (
              <InteractionCard key={i} it={it as any} />
            ))}
          </div>
        </section>
      )}

      {/* 신살 — 길/흉/특수살 그룹 */}
      {saju.sinSals.length > 0 && (
        <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3 space-y-2">
          <div className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">
            신살
          </div>
          {(['good', 'neutral', 'bad'] as const).map((t) => (
            <SinSalGroup
              key={t}
              type={t}
              items={saju.sinSals.filter((s) => s.type === t)}
            />
          ))}
        </section>
      )}

      {/* 대운 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">대운 (10년 단위)</span>
          <span className="text-[13px] text-text-secondary">대운수 {saju.daeWoonStartAge + 1}</span>
        </div>
        <div ref={daeWoonScrollRef} className="overflow-x-auto -mx-4 px-4 scroll-smooth">
          <div className="flex gap-2 min-w-max">
            {/* lunar-javascript 의 daeWoon[].startAge 는 사실 시작 "연도(calendar year)".
                첫 항목은 출생년~대운수 직전(부모운 구간) 이므로 건너뛰고
                본격 대운(대운수, +10, +20, ...) 부터 표기 — 다른 어플과 동일 */}
            {saju.daeWoon.slice(1, 11).map((dw, i) => {
              const ganEl = STEM_ELEMENT[dw.gan] as Element;
              const zhiEl = BRANCH_ELEMENT[dw.zhi] as Element;
              const startCalYear = dw.startAge;             // 시작 양력 연도
              const koreanAgeStart = startCalYear - birthYear + 1; // 한국 나이
              const koreanAgeEnd = koreanAgeStart + 9;
              const isCurrent = age >= koreanAgeStart && age <= koreanAgeEnd;
              return (
                <div
                  key={i}
                  data-current={isCurrent ? 'true' : undefined}
                  className={`w-[72px] flex flex-col items-center gap-1.5 p-2 rounded-lg ${
                    isCurrent
                      ? 'border-2 border-dashed border-cta bg-cta/10'
                      : 'border border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-[15px] font-bold text-text-primary leading-none">
                    {koreanAgeStart}
                  </span>
                  <span className="text-[10px] text-text-tertiary leading-none">{startCalYear}</span>
                  <span className="text-[11px] text-text-tertiary">{dw.tenGod}</span>
                  <ElementCell element={ganEl} text={stemToHanja(dw.gan)} size="sm" />
                  <ElementCell element={zhiEl} text={zhiToHanja(dw.zhi)} size="sm" />
                  <span className="text-[11px] text-text-tertiary">{dw.twelveStage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 세운 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">세운 (10년)</span>
          <span className="text-[13px] text-text-secondary">올해 {saju.currentSeWoon.gan}{saju.currentSeWoon.zhi}</span>
        </div>
        <div ref={seWoonScrollRef} className="overflow-x-auto -mx-4 px-4 scroll-smooth">
          <div className="flex gap-2 min-w-max">
            {saju.seWoon.map((sw) => {
              const ganEl = STEM_ELEMENT[sw.gan] as Element;
              const zhiEl = BRANCH_ELEMENT[sw.zhi] as Element;
              const isCurrent = sw.year === thisYear;
              return (
                <div
                  key={sw.year}
                  data-current={isCurrent ? 'true' : undefined}
                  className={`w-[72px] flex flex-col items-center gap-1.5 p-2 rounded-lg ${
                    isCurrent
                      ? 'border-2 border-dashed border-cta bg-cta/10'
                      : 'border border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-[13px] font-bold text-text-primary leading-none">{sw.year}</span>
                  <span className="text-[10px] text-text-tertiary leading-none">
                    {sw.year - birthYear + 1}세
                  </span>
                  <span className="text-[11px] text-text-tertiary">{sw.tenGod}</span>
                  <ElementCell element={ganEl} text={stemToHanja(sw.gan)} size="sm" />
                  <ElementCell element={zhiEl} text={zhiToHanja(sw.zhi)} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 하단 안내 */}
      <p className="text-[12px] text-text-tertiary text-center mt-4 leading-relaxed">
        이 만세력은 대표 프로필을 기준으로 자동 계산됩니다.
        <br />
        다른 가족/지인의 만세력을 보려면 프로필을 변경하세요.
      </p>
    </motion.div>
  );
}
