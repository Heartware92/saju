'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PalaceMeta {
  short: string;
  description: string;
}

const PALACE_TERM_DICT: Record<string, PalaceMeta> = {
  '명궁': {
    short: '본질·인생 방향의 자리',
    description: '내가 어떤 사람인지, 인생을 어떻게 풀어갈지를 알려주는 가장 중심이 되는 방이에요. 명궁의 별이 곧 그 사람의 기본 색깔이라 보면 됩니다.',
  },
  '형제궁': {
    short: '형제·동료의 자리',
    description: '형제자매와 가까운 동료·친구의 인연을 보는 방. 우애와 협력의 결, 또는 경쟁·다툼의 결을 함께 읽어요.',
  },
  '부처궁': {
    short: '배우자·연인의 자리',
    description: '배우자, 연인, 장기 파트너(동업 포함)의 성향과 우리와의 궁합을 보는 방이에요. 결혼의 시기나 관계의 결을 살핍니다.',
  },
  '자녀궁': {
    short: '자녀·창작물의 자리',
    description: '자녀운과 함께, 내가 낳는 모든 것 — 작품·제자·프로젝트 같은 창조적 결과물을 보는 방이에요.',
  },
  '재백궁': {
    short: '돈의 흐름이 머무는 자리',
    description: '월급·사업 수입처럼 들어오는 돈과 쓰는 씀씀이를 함께 읽는 방. 수입원의 성격과 소비 성향이 드러나요.',
  },
  '질액궁': {
    short: '건강·재액의 자리',
    description: '약한 신체 부위, 잘 걸리는 병의 유형, 그리고 인생에서 조심할 재난·사고의 결을 보는 방이에요.',
  },
  '천이궁': {
    short: '이동·외부 활동의 자리',
    description: '해외·출장·이사 같은 이동운, 그리고 집 밖에서의 활동운을 보는 방. 명궁과 마주 앉아 있어 인생 전체와 짝을 이뤄요.',
  },
  '노복궁': {
    short: '친구·인맥의 자리',
    description: '부하 직원, 친구, 수평 인간관계 — "내 곁의 사람들"의 복을 보는 방이에요. 인덕이 두텁냐 박하냐가 드러납니다.',
  },
  '관록궁': {
    short: '직업·지위의 자리',
    description: '커리어의 성향과 성패, 사회적 명성·지위를 보는 방. 어떤 일이 잘 맞고 어떤 자리까지 오를지를 살핍니다.',
  },
  '전택궁': {
    short: '집·부동산의 자리',
    description: '내가 사는 공간, 부동산, 그리고 가업·집안의 운을 보는 방이에요. 안식처가 든든한지 흔들리는지를 봅니다.',
  },
  '복덕궁': {
    short: '마음·여가의 자리',
    description: '정신세계, 취미, 복록 — 마음의 평안과 즐거움을 보는 방이에요. 인생의 만족도가 가장 직접적으로 드러나요.',
  },
  '부모궁': {
    short: '부모·윗사람의 자리',
    description: '부모와의 관계, 그리고 직장 상사·스승 같은 윗사람의 운을 보는 방. 어른들로부터 받는 도움의 결이 보입니다.',
  },
};

interface Props {
  palaceName: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PalaceTermLabel({ palaceName, className, style }: Props) {
  const [open, setOpen] = useState(false);
  const meta = PALACE_TERM_DICT[palaceName];

  const display = palaceName.replace('궁', '');

  if (!meta) {
    return <span className={className} style={style}>{display}</span>;
  }

  const popover = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(6, 4, 18, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: 'min(320px, calc(100vw - 32px))',
              padding: 20,
              background: '#1C1033',
              border: '1px solid rgba(168, 132, 255, 0.35)',
              borderRadius: 16,
              boxShadow: '0 18px 48px rgba(0, 0, 0, 0.55)',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--cta-primary)',
                fontFamily: 'var(--font-serif)',
                marginBottom: 8,
              }}
            >
              {palaceName}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {meta.short}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
              }}
            >
              {meta.description}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={`${palaceName} 설명 보기`}
        className={className}
        style={{
          all: 'unset',
          cursor: 'pointer',
          borderBottom: '1px dashed rgba(168, 132, 255, 0.4)',
          transition: 'border-color 0.15s, color 0.15s',
          display: 'inline',
          font: 'inherit',
          color: 'inherit',
          lineHeight: 'inherit',
          ...style,
        }}
      >
        {display}
      </button>
      {typeof document !== 'undefined' ? createPortal(popover, document.body) : popover}
    </>
  );
}
