'use client';

import { motion } from 'framer-motion';
import type { MutagenPlacement } from '../../engine/zamidusu/visualization';

interface MutagenCardsProps {
  placements: MutagenPlacement[];
}

const TONE_STYLE: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  '화록': {
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.32)',
    accent: '#4ADE80',
    label: '복록의 별',
  },
  '화권': {
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.32)',
    accent: '#A78BFA',
    label: '권세의 별',
  },
  '화과': {
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.32)',
    accent: '#FBBF24',
    label: '명예의 별',
  },
  '화기': {
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.32)',
    accent: '#F87171',
    label: '집착의 별',
  },
};

export function MutagenCards({ placements }: MutagenCardsProps) {
  if (placements.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ display: 'inline-block', width: 4, height: 20, borderRadius: 2, background: 'var(--cta-primary)' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em' }}>
          사화(四化) — 별의 변주
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: 14, paddingLeft: 12 }}>
        태어난 해의 천간이 네 별을 변화시킵니다. 각 별이 어느 방에 머무는지에 따라 인생의 어떤 영역이 빛나고 어디서 시험을 받는지 드러납니다.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {placements.map((p, i) => {
          const style = TONE_STYLE[p.name] ?? TONE_STYLE['화록'];
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 12,
                padding: '12px 12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 12, color: style.accent, fontWeight: 700, letterSpacing: 1 }}>
                  {style.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-serif)' }}>
                  {p.hanja}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                  {p.starName} → {p.palaceName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {p.palaceDomain}
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {p.tone === 'positive' ? p.positive : p.caution}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
