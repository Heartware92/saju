'use client';

/**
 * 타로 상담 — 78장 풀덱 기반, AI·크레딧 없이 결정론적 리딩
 * 모드: 오늘 1장 / 이달 3장 / 질문 1장
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TAROT_DECK, ELEMENT_COLORS, SUIT_SYMBOL, type TarotCard } from '../engine/tarot/deck';
import { buildTarotReading, type DrawnCard, type TarotReading, type TarotSpread } from '../engine/tarot/reading';
import { drawOne, drawMany, getTodayKey, getMonthKey, formatTodayString, formatMonthString } from '../utils/tarotSeed';

type TarotMode = 'today' | 'monthly' | 'question';
type QuestionState = 'select' | 'shuffling' | 'spread' | 'revealed';

function CardFace({ drawn, width = 120 }: { drawn: DrawnCard; width?: number }) {
  const { card, isReversed, position } = drawn;
  const color = ELEMENT_COLORS[card.element];
  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        width,
        minHeight: width * 1.5,
        background: `${color}18`,
        border: `2px solid ${color}`,
        borderRadius: 14,
        padding: '14px 10px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {position && (
        <div className="text-[10px] text-text-tertiary mb-1 font-semibold">{position}</div>
      )}
      <div style={{ transform: isReversed ? 'rotate(180deg)' : 'none' }}>
        <div className="text-[18px] mb-1">{SUIT_SYMBOL[card.suit]}</div>
        <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
          {card.symbol}
        </div>
        <div className="text-[13px] font-semibold mt-1 text-text-primary">{card.nameKr}</div>
        <div className="text-[10px] text-text-tertiary mt-0.5">{card.name}</div>
      </div>
      <div
        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
        style={{ backgroundColor: isReversed ? '#F8717133' : '#34D39933', color: isReversed ? '#F87171' : '#34D399' }}
      >
        {isReversed ? '역' : '정'}
      </div>
    </motion.div>
  );
}

function ContextBlock({ block, color }: { block: TarotReading['contexts'][number]; color: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/5 border border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }} className="text-[14px]">{block.icon}</span>
        <span className="text-[13px] font-semibold text-text-primary">{block.label}</span>
      </div>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-2">{block.text}</p>
      {block.cardLines.length > 1 && (
        <ul className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
          {block.cardLines.map((line, i) => (
            <li key={i} className="text-[11.5px] text-text-tertiary leading-relaxed">· {line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReadingView({ reading, color }: { reading: TarotReading; color: string }) {
  return (
    <div className="space-y-3">
      {/* 헤드라인 */}
      <section
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}55` }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">타로 리딩</div>
        <div className="text-[18px] font-bold mb-1" style={{ color, fontFamily: 'var(--font-serif)' }}>
          {reading.headline}
        </div>
        <div className="text-[13px] text-text-secondary">{reading.subhead}</div>
      </section>

      {/* 키워드 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">키워드</div>
        <div className="flex flex-wrap gap-1.5">
          {reading.keywords.map((k, i) => (
            <span
              key={i}
              className="text-[12px] px-2.5 py-1 rounded-md border"
              style={{ borderColor: `${color}55`, color, backgroundColor: `${color}12` }}
            >
              {k}
            </span>
          ))}
        </div>
      </section>

      {/* 종합 서사 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">종합 해석</div>
        <div className="space-y-3">
          {reading.synthesis.map((p, i) => (
            <p key={i} className="text-[13px] text-text-secondary leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      {/* 맥락별 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">맥락별 풀이</div>
        <div className="space-y-2">
          {reading.contexts.map((b, i) => (
            <ContextBlock key={i} block={b} color={color} />
          ))}
        </div>
      </section>

      {/* 조언 */}
      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold mb-2" style={{ color: '#34D399' }}>카드의 조언</div>
        <ul className="space-y-1.5">
          {reading.advice.map((a, i) => (
            <li key={i} className="text-[12px] text-text-secondary flex gap-2">
              <span style={{ color: '#34D399' }}>✓</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function TarotPage() {
  const [mode, setMode] = useState<TarotMode>('today');

  // 오늘/이달 공통
  const [autoDrawn, setAutoDrawn] = useState<DrawnCard[]>([]);
  const [autoStarted, setAutoStarted] = useState(false);

  // 질문 모드
  const [qState, setQState] = useState<QuestionState>('select');
  const [qSpread, setQSpread] = useState<number[]>([]);
  const [qDrawn, setQDrawn] = useState<DrawnCard | null>(null);

  // 모드 전환 시 초기화
  useEffect(() => {
    setAutoDrawn([]);
    setAutoStarted(false);
    setQState('select');
    setQSpread([]);
    setQDrawn(null);
  }, [mode]);

  const runToday = () => {
    if (autoStarted) return;
    setAutoStarted(true);
    const key = getTodayKey();
    const { cardIndex, isReversed } = drawOne(key, TAROT_DECK.length, 0.35);
    setAutoDrawn([{ card: TAROT_DECK[cardIndex], isReversed, position: '오늘' }]);
  };

  const runMonthly = () => {
    if (autoStarted) return;
    setAutoStarted(true);
    const key = getMonthKey();
    const draws = drawMany(key, 3, TAROT_DECK.length, 0.35);
    const labels = ['상순', '중순', '하순'];
    setAutoDrawn(
      draws.map((d, i) => ({
        card: TAROT_DECK[d.cardIndex],
        isReversed: d.isReversed,
        position: labels[i],
      }))
    );
  };

  const shuffleForQuestion = () => {
    setQState('shuffling');
    const indices = Array.from({ length: TAROT_DECK.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setQSpread(indices.slice(0, 22)); // 화면에 표시할 스프레드
    setTimeout(() => setQState('spread'), 1200);
  };

  const pickQuestionCard = (idxInSpread: number) => {
    if (qState !== 'spread') return;
    const cardIndex = qSpread[idxInSpread];
    const reversed = Math.random() < 0.35;
    setQDrawn({ card: TAROT_DECK[cardIndex], isReversed: reversed, position: '질문' });
    setQState('revealed');
  };

  const reading: TarotReading | null = useMemo(() => {
    if (mode === 'today' && autoDrawn.length === 1) {
      return buildTarotReading(autoDrawn, 'single');
    }
    if (mode === 'monthly' && autoDrawn.length === 3) {
      return buildTarotReading(autoDrawn, 'three');
    }
    if (mode === 'question' && qDrawn) {
      return buildTarotReading([qDrawn], 'question');
    }
    return null;
  }, [mode, autoDrawn, qDrawn]);

  const primaryColor = useMemo(() => {
    const first = autoDrawn[0]?.card ?? qDrawn?.card;
    return first ? ELEMENT_COLORS[first.element] : '#C4B5FD';
  }, [autoDrawn, qDrawn]);

  const modeLabels: Record<TarotMode, string> = {
    today: '오늘의 타로',
    monthly: '이달의 타로',
    question: '질문 타로',
  };

  return (
    <div className="w-full px-4 pt-4 pb-10">
      <div className="text-center mb-4">
        <h1 className="text-[22px] font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          타로 상담
        </h1>
        <p className="text-[13px] text-text-tertiary mt-1">78장 라이더-웨이트 풀덱 · 무료</p>
      </div>

      {/* 모드 탭 */}
      <div className="flex gap-1 max-w-[520px] mx-auto mb-4 p-1 rounded-xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        {(['today', 'monthly', 'question'] as TarotMode[]).map(m => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 rounded-lg text-[13px] transition-colors"
              style={{
                fontWeight: active ? 700 : 500,
                background: active ? 'var(--cta-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--text-tertiary)',
              }}
            >
              {modeLabels[m]}
            </button>
          );
        })}
      </div>

      <div className="max-w-[640px] mx-auto">
        {/* 오늘/이달 */}
        {(mode === 'today' || mode === 'monthly') && (
          <>
            {!autoStarted ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 text-center bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
              >
                <p className="text-[13px] text-text-tertiary mb-2">
                  {mode === 'today' ? formatTodayString() : formatMonthString()}
                </p>
                <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
                  {mode === 'today'
                    ? '오늘 당신에게 정해진 한 장 — 같은 날짜에는 같은 카드가 나타납니다.'
                    : '이달의 흐름을 상순·중순·하순 세 장으로 짚어드립니다.'}
                </p>
                <motion.button
                  onClick={mode === 'today' ? runToday : runMonthly}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3 rounded-xl font-bold text-white"
                  style={{ background: 'var(--cta-primary)', boxShadow: '0 4px 16px rgba(124,92,252,0.35)' }}
                >
                  {mode === 'today' ? '오늘의 카드 펼치기' : '이달의 카드 펼치기'}
                </motion.button>
              </motion.div>
            ) : (
              <>
                <div className="flex justify-center gap-3 flex-wrap mb-5">
                  {autoDrawn.map((d, i) => (
                    <CardFace key={i} drawn={d} width={mode === 'monthly' ? 100 : 140} />
                  ))}
                </div>
                {reading && <ReadingView reading={reading} color={primaryColor} />}
                <button
                  onClick={() => { setAutoStarted(false); setAutoDrawn([]); }}
                  className="w-full mt-4 py-3 rounded-xl border border-[var(--border-subtle)] text-[13px] text-text-secondary"
                >
                  다시 펼치기
                </button>
              </>
            )}
          </>
        )}

        {/* 질문 모드 */}
        {mode === 'question' && (
          <>
            {qState === 'select' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 text-center bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
              >
                <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
                  마음속 질문 하나를 떠올리고, 카드를 섞어 직접 선택하세요.
                </p>
                <motion.button
                  onClick={shuffleForQuestion}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3 rounded-xl font-bold text-white"
                  style={{ background: 'var(--cta-primary)', boxShadow: '0 4px 16px rgba(124,92,252,0.35)' }}
                >
                  카드 섞고 펼치기
                </motion.button>
              </motion.div>
            )}

            {(qState === 'shuffling' || qState === 'spread') && (
              <div className="relative flex justify-center items-center flex-wrap gap-1" style={{ minHeight: 220, marginTop: 40 }}>
                {(qState === 'shuffling'
                  ? Array.from({ length: 22 })
                  : qSpread
                ).map((_, i) => (
                  <motion.div
                    key={i}
                    onClick={() => pickQuestionCard(i)}
                    whileHover={qState === 'spread' ? { y: -10, scale: 1.1 } : {}}
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={
                      qState === 'spread'
                        ? { x: (i - 10.5) * 14, y: Math.sin((i - 10.5) * 0.3) * 18, rotate: (i - 10.5) * 2 }
                        : { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 40, rotate: (Math.random() - 0.5) * 20 }
                    }
                    transition={{ duration: 0.5, delay: i * 0.02 }}
                    className="absolute cursor-pointer"
                    style={{
                      width: 60,
                      height: 90,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, rgba(124,92,252,0.4), rgba(124,92,252,0.15))',
                      border: '2px solid var(--cta-primary)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 18,
                    }}
                  >
                    ?
                  </motion.div>
                ))}
              </div>
            )}

            {qState === 'revealed' && qDrawn && reading && (
              <>
                <div className="flex justify-center mb-5">
                  <CardFace drawn={qDrawn} width={160} />
                </div>
                <ReadingView reading={reading} color={primaryColor} />
                <button
                  onClick={() => { setQState('select'); setQDrawn(null); setQSpread([]); }}
                  className="w-full mt-4 py-3 rounded-xl border border-[var(--border-subtle)] text-[13px] text-text-secondary"
                >
                  다른 질문 · 다시 뽑기
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
