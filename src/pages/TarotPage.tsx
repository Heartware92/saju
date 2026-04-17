'use client';

/**
 * 타로 상담 — 78장 풀덱 기반, 사주 × 타로 AI 융합 리딩
 * 모드: 오늘 1장 / 이달 3장 / 질문 1장
 * 대표 프로필 사주 데이터를 AI에 함께 전달하여 개인화된 해석 제공
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TAROT_DECK, ELEMENT_COLORS, SUIT_SYMBOL, type TarotCard } from '../engine/tarot/deck';
import { buildTarotReading, type DrawnCard, type TarotReading, type TarotSpread } from '../engine/tarot/reading';
import { drawOne, drawMany, getTodayKey, getMonthKey, formatTodayString, formatMonthString } from '../utils/tarotSeed';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { getHybridReading } from '../services/fortuneService';
import type { TarotCardInfo } from '../services/api';
import type { SajuResult } from '../utils/sajuCalculator';

type TarotMode = 'today' | 'monthly' | 'question';
type QuestionState = 'select' | 'shuffling' | 'spread' | 'revealed';

function drawnToCardInfo(drawn: DrawnCard): TarotCardInfo {
  const dir = drawn.isReversed ? 'reversed' : 'upright';
  return {
    name: drawn.card.name,
    nameKr: drawn.card.nameKr,
    element: drawn.card.element,
    isReversed: drawn.isReversed,
    keywords: drawn.card.keywords[drawn.isReversed ? 'reversed' : 'upright'],
    meaning: drawn.card[dir].overall,
  };
}

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

      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">종합 해석</div>
        <div className="space-y-3">
          {reading.synthesis.map((p, i) => (
            <p key={i} className="text-[13px] text-text-secondary leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">맥락별 풀이</div>
        <div className="space-y-2">
          {reading.contexts.map((b, i) => (
            <ContextBlock key={i} block={b} color={color} />
          ))}
        </div>
      </section>

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

function AIReadingView({ content, color }: { content: string; color: string }) {
  const paragraphs = content.split('\n\n').filter(Boolean);
  return (
    <div className="space-y-3">
      <section
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}55` }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          사주 × 타로 AI 리딩
        </div>
        <div className="text-[16px] font-bold" style={{ color, fontFamily: 'var(--font-serif)' }}>
          당신의 사주와 카드가 만나는 순간
        </div>
      </section>

      <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="space-y-3">
          {paragraphs.map((p, i) => {
            const trimmed = p.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('·')) {
              const lines = trimmed.split('\n');
              return (
                <ul key={i} className="space-y-1.5">
                  {lines.map((line, j) => (
                    <li key={j} className="text-[13px] text-text-secondary leading-relaxed flex gap-2">
                      <span style={{ color }} className="shrink-0">·</span>
                      <span>{line.replace(/^[-·]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">
                {trimmed}
              </p>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LoadingSpinner({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          width: 40,
          height: 40,
          border: `3px solid ${color}33`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
        }}
      />
      <p className="text-[13px] text-text-tertiary">사주와 타로를 융합하여 해석하는 중...</p>
    </div>
  );
}

function NoPrimaryModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-6 max-w-sm w-full bg-[rgba(20,12,38,0.95)] border border-[var(--border-subtle)]"
      >
        <div className="text-center">
          <div className="text-[32px] mb-3">✦</div>
          <h3 className="text-[17px] font-bold text-text-primary mb-2">대표 프로필이 필요합니다</h3>
          <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
            사주와 타로를 융합한 AI 리딩을 위해<br />
            대표 프로필을 먼저 등록해 주세요.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[13px] text-text-secondary"
            >
              닫기
            </button>
            <button
              onClick={() => router.push('/saju/input')}
              className="flex-1 py-2.5 rounded-xl font-bold text-white text-[13px]"
              style={{ background: 'var(--cta-primary)' }}
            >
              프로필 등록하기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function TarotPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { profiles, fetchProfiles, hydrated } = useProfileStore();

  const [mode, setMode] = useState<TarotMode>('today');
  const [showNoPrimaryModal, setShowNoPrimaryModal] = useState(false);

  // 오늘/이달 공통
  const [autoDrawn, setAutoDrawn] = useState<DrawnCard[]>([]);
  const [autoStarted, setAutoStarted] = useState(false);

  // 질문 모드
  const [qState, setQState] = useState<QuestionState>('select');
  const [qSpread, setQSpread] = useState<number[]>([]);
  const [qDrawn, setQDrawn] = useState<DrawnCard | null>(null);

  // AI 리딩
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? null,
    [profiles],
  );

  const sajuResult = useMemo<SajuResult | null>(() => {
    if (!primary) return null;
    return computeSajuFromProfile(primary);
  }, [primary]);

  // 모드 전환 시 초기화
  useEffect(() => {
    setAutoDrawn([]);
    setAutoStarted(false);
    setQState('select');
    setQSpread([]);
    setQDrawn(null);
    setAiContent(null);
    setAiLoading(false);
    setAiError(null);
  }, [mode]);

  const callAI = async (drawnCards: DrawnCard[], currentMode: TarotMode) => {
    if (!sajuResult) {
      setShowNoPrimaryModal(true);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiContent(null);

    try {
      if (currentMode === 'today') {
        const cardInfo = drawnToCardInfo(drawnCards[0]);
        const res = await getHybridReading(sajuResult, cardInfo);
        if (res.success && res.content) {
          setAiContent(res.content);
        } else {
          setAiError(res.error || '해석을 불러오지 못했습니다.');
        }
      } else if (currentMode === 'monthly') {
        const cardInfo = drawnToCardInfo(drawnCards[0]);
        const res = await getHybridReading(sajuResult, cardInfo, '이달의 전체적인 흐름');
        if (res.success && res.content) {
          setAiContent(res.content);
        } else {
          setAiError(res.error || '해석을 불러오지 못했습니다.');
        }
      } else {
        const cardInfo = drawnToCardInfo(drawnCards[0]);
        const res = await getHybridReading(sajuResult, cardInfo, '질문에 대한 답');
        if (res.success && res.content) {
          setAiContent(res.content);
        } else {
          setAiError(res.error || '해석을 불러오지 못했습니다.');
        }
      }
    } catch (e: any) {
      setAiError(e.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  const runToday = () => {
    if (autoStarted) return;
    if (!sajuResult) {
      setShowNoPrimaryModal(true);
      return;
    }
    setAutoStarted(true);
    const key = getTodayKey();
    const { cardIndex, isReversed } = drawOne(key, TAROT_DECK.length, 0.35);
    const drawn: DrawnCard[] = [{ card: TAROT_DECK[cardIndex], isReversed, position: '오늘' }];
    setAutoDrawn(drawn);
    callAI(drawn, 'today');
  };

  const runMonthly = () => {
    if (autoStarted) return;
    if (!sajuResult) {
      setShowNoPrimaryModal(true);
      return;
    }
    setAutoStarted(true);
    const key = getMonthKey();
    const draws = drawMany(key, 3, TAROT_DECK.length, 0.35);
    const labels = ['상순', '중순', '하순'];
    const drawn: DrawnCard[] = draws.map((d, i) => ({
      card: TAROT_DECK[d.cardIndex],
      isReversed: d.isReversed,
      position: labels[i],
    }));
    setAutoDrawn(drawn);
    callAI(drawn, 'monthly');
  };

  const shuffleForQuestion = () => {
    if (!sajuResult) {
      setShowNoPrimaryModal(true);
      return;
    }
    setQState('shuffling');
    const indices = Array.from({ length: TAROT_DECK.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setQSpread(indices.slice(0, 22));
    setTimeout(() => setQState('spread'), 1200);
  };

  const pickQuestionCard = (idxInSpread: number) => {
    if (qState !== 'spread') return;
    const cardIndex = qSpread[idxInSpread];
    const reversed = Math.random() < 0.35;
    const drawn: DrawnCard = { card: TAROT_DECK[cardIndex], isReversed: reversed, position: '질문' };
    setQDrawn(drawn);
    setQState('revealed');
    callAI([drawn], 'question');
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
      {showNoPrimaryModal && (
        <NoPrimaryModal onClose={() => setShowNoPrimaryModal(false)} />
      )}

      <div className="text-center mb-4">
        <h1 className="text-[22px] font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          타로 상담
        </h1>
        <p className="text-[13px] text-text-tertiary mt-1">78장 라이더-웨이트 풀덱 · 사주 융합 AI 리딩</p>
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
                    ? '오늘 당신에게 정해진 한 장 — 사주와 융합하여 AI가 해석합니다.'
                    : '이달의 흐름을 세 장으로 짚고, 사주와 융합하여 AI가 해석합니다.'}
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
                {aiLoading && <LoadingSpinner color={primaryColor} />}
                {aiError && (
                  <div className="rounded-2xl p-4 text-center bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)]">
                    <p className="text-[13px] text-[#F87171] mb-3">{aiError}</p>
                    <button
                      onClick={() => callAI(autoDrawn, mode)}
                      className="text-[12px] text-text-secondary underline"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                {aiContent && <AIReadingView content={aiContent} color={primaryColor} />}
                {!aiLoading && !aiContent && !aiError && reading && (
                  <ReadingView reading={reading} color={primaryColor} />
                )}
                <button
                  onClick={() => { setAutoStarted(false); setAutoDrawn([]); setAiContent(null); setAiError(null); }}
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
                  마음속 질문 하나를 떠올리고, 카드를 섞어 직접 선택하세요.<br />
                  사주와 융합하여 AI가 깊은 해석을 드립니다.
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

            {qState === 'revealed' && qDrawn && (
              <>
                <div className="flex justify-center mb-5">
                  <CardFace drawn={qDrawn} width={160} />
                </div>
                {aiLoading && <LoadingSpinner color={primaryColor} />}
                {aiError && (
                  <div className="rounded-2xl p-4 text-center bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)]">
                    <p className="text-[13px] text-[#F87171] mb-3">{aiError}</p>
                    <button
                      onClick={() => callAI([qDrawn], 'question')}
                      className="text-[12px] text-text-secondary underline"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                {aiContent && <AIReadingView content={aiContent} color={primaryColor} />}
                {!aiLoading && !aiContent && !aiError && reading && (
                  <ReadingView reading={reading} color={primaryColor} />
                )}
                <button
                  onClick={() => { setQState('select'); setQDrawn(null); setQSpread([]); setAiContent(null); setAiError(null); }}
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
