'use client';

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateTarotPrompt, TarotElement, TarotCardInfo } from '../services/api'
import { getTodayTarotReading, getMonthlyTarotReading } from '../services/fortuneService'
import { drawOne, drawMany, getTodayKey, getMonthKey, formatTodayString, formatMonthString } from '../utils/tarotSeed'
import { useCreditStore } from '../store/useCreditStore'
import styles from './TarotPage.module.css'

interface TarotCard {
  id: number
  name: string
  nameKr: string
  symbol: string
  element: TarotElement
  keywords: {
    upright: string[]
    reversed: string[]
  }
  meaning: string
  meaningReversed: string
}

const TAROT_CARDS: TarotCard[] = [
  { id: 0, name: "The Fool", nameKr: "광대", symbol: "0", element: 'Air',
    keywords: { upright: ['새로운 시작', '순수함', '모험'], reversed: ['무모함', '경솔함', '위험'] },
    meaning: "새로운 시작, 순수함, 자유로운 영혼", meaningReversed: "무모한 결정, 경솔함, 위험 신호 무시" },
  { id: 1, name: "The Magician", nameKr: "마법사", symbol: "I", element: 'Air',
    keywords: { upright: ['창조력', '의지력', '재능'], reversed: ['속임수', '미숙함', '재능 낭비'] },
    meaning: "창조력, 의지력, 재능의 발현", meaningReversed: "속임수, 재능의 오용, 자기기만" },
  { id: 2, name: "The High Priestess", nameKr: "여사제", symbol: "II", element: 'Water',
    keywords: { upright: ['직관', '비밀', '지혜'], reversed: ['억압된 감정', '비밀 유출', '혼란'] },
    meaning: "직관, 비밀, 내면의 지혜", meaningReversed: "직관 무시, 억압된 감정, 표면적 판단" },
  { id: 3, name: "The Empress", nameKr: "여황제", symbol: "III", element: 'Earth',
    keywords: { upright: ['풍요', '모성', '창조'], reversed: ['의존성', '공허함', '창조력 부족'] },
    meaning: "풍요, 모성, 창조적 에너지", meaningReversed: "창조력 고갈, 과잉보호, 의존성" },
  { id: 4, name: "The Emperor", nameKr: "황제", symbol: "IV", element: 'Fire',
    keywords: { upright: ['권위', '안정', '리더십'], reversed: ['독재', '경직', '통제 욕구'] },
    meaning: "권위, 안정, 리더십", meaningReversed: "독재적 성향, 유연성 부족, 권위 남용" },
  { id: 5, name: "The Hierophant", nameKr: "교황", symbol: "V", element: 'Earth',
    keywords: { upright: ['전통', '가르침', '영적 인도'], reversed: ['고정관념', '맹종', '자유 억압'] },
    meaning: "전통, 가르침, 영적 인도", meaningReversed: "고정관념, 형식주의, 자유로운 사고 억압" },
  { id: 6, name: "The Lovers", nameKr: "연인", symbol: "VI", element: 'Air',
    keywords: { upright: ['사랑', '조화', '선택'], reversed: ['불화', '잘못된 선택', '유혹'] },
    meaning: "사랑, 조화, 중요한 선택", meaningReversed: "관계의 불화, 잘못된 선택, 가치관 충돌" },
  { id: 7, name: "The Chariot", nameKr: "전차", symbol: "VII", element: 'Water',
    keywords: { upright: ['승리', '의지력', '전진'], reversed: ['방향 상실', '통제 불능', '공격성'] },
    meaning: "승리, 의지력, 결단력", meaningReversed: "방향 상실, 자기 통제 실패, 강압적 태도" },
  { id: 8, name: "Strength", nameKr: "힘", symbol: "VIII", element: 'Fire',
    keywords: { upright: ['내면의 힘', '용기', '인내'], reversed: ['자기 의심', '나약함', '분노'] },
    meaning: "내면의 힘, 용기, 인내", meaningReversed: "자기 의심, 내면의 나약함, 분노 폭발" },
  { id: 9, name: "The Hermit", nameKr: "은둔자", symbol: "IX", element: 'Earth',
    keywords: { upright: ['내면 탐색', '지혜', '고독'], reversed: ['고립', '외로움', '현실 도피'] },
    meaning: "내면 탐색, 지혜, 고독", meaningReversed: "과도한 고립, 외로움, 현실 회피" },
  { id: 10, name: "Wheel of Fortune", nameKr: "운명의 수레바퀴", symbol: "X", element: 'Fire',
    keywords: { upright: ['변화', '행운', '전환점'], reversed: ['악운', '저항', '정체'] },
    meaning: "변화, 운명, 전환점", meaningReversed: "불운의 연속, 변화에 대한 저항, 정체기" },
  { id: 11, name: "Justice", nameKr: "정의", symbol: "XI", element: 'Air',
    keywords: { upright: ['공정함', '진실', '균형'], reversed: ['불공정', '편견', '책임 회피'] },
    meaning: "공정함, 진실, 인과응보", meaningReversed: "불공정한 대우, 편견, 책임 회피" },
  { id: 12, name: "The Hanged Man", nameKr: "매달린 사람", symbol: "XII", element: 'Water',
    keywords: { upright: ['희생', '새로운 관점', '수용'], reversed: ['무의미한 희생', '저항', '이기심'] },
    meaning: "희생, 새로운 관점, 정지", meaningReversed: "무의미한 희생, 변화 거부, 이기적 태도" },
  { id: 13, name: "Death", nameKr: "죽음", symbol: "XIII", element: 'Water',
    keywords: { upright: ['변환', '끝과 시작', '재탄생'], reversed: ['변화 거부', '집착', '정체'] },
    meaning: "변화, 끝과 시작, 변환", meaningReversed: "변화에 대한 두려움, 과거에 대한 집착" },
  { id: 14, name: "Temperance", nameKr: "절제", symbol: "XIV", element: 'Fire',
    keywords: { upright: ['균형', '조화', '인내'], reversed: ['불균형', '과잉', '조급함'] },
    meaning: "균형, 조화, 중용", meaningReversed: "균형 상실, 극단적 행동, 조급함" },
  { id: 15, name: "The Devil", nameKr: "악마", symbol: "XV", element: 'Earth',
    keywords: { upright: ['유혹', '속박', '집착'], reversed: ['해방', '각성', '자유'] },
    meaning: "유혹, 속박, 물질주의", meaningReversed: "속박에서의 해방, 집착 극복, 자유 획득" },
  { id: 16, name: "The Tower", nameKr: "탑", symbol: "XVI", element: 'Fire',
    keywords: { upright: ['급변', '깨달음', '충격'], reversed: ['변화 회피', '점진적 변화', '두려움'] },
    meaning: "급변, 깨달음, 붕괴", meaningReversed: "필요한 변화의 회피, 점진적 붕괴" },
  { id: 17, name: "The Star", nameKr: "별", symbol: "XVII", element: 'Air',
    keywords: { upright: ['희망', '영감', '치유'], reversed: ['절망', '희망 상실', '불신'] },
    meaning: "희망, 영감, 치유", meaningReversed: "희망 상실, 자기 불신, 영감 부재" },
  { id: 18, name: "The Moon", nameKr: "달", symbol: "XVIII", element: 'Water',
    keywords: { upright: ['직관', '무의식', '환상'], reversed: ['혼란 극복', '진실 발견', '두려움 해소'] },
    meaning: "환상, 불안, 무의식", meaningReversed: "혼란 해소, 두려움 극복, 진실 직면" },
  { id: 19, name: "The Sun", nameKr: "태양", symbol: "XIX", element: 'Fire',
    keywords: { upright: ['성공', '기쁨', '활력'], reversed: ['일시적 좌절', '자만', '성공 지연'] },
    meaning: "성공, 기쁨, 활력", meaningReversed: "일시적 좌절, 지나친 낙관, 성공의 지연" },
  { id: 20, name: "Judgement", nameKr: "심판", symbol: "XX", element: 'Spirit',
    keywords: { upright: ['부활', '각성', '판단'], reversed: ['자기 비판', '후회', '판단 오류'] },
    meaning: "부활, 결산, 각성", meaningReversed: "자기 비판, 과거에 대한 후회, 판단 미루기" },
  { id: 21, name: "The World", nameKr: "세계", symbol: "XXI", element: 'Earth',
    keywords: { upright: ['완성', '성취', '통합'], reversed: ['미완성', '지연', '부족함'] },
    meaning: "완성, 성취, 통합", meaningReversed: "미완성, 목표 미달성, 마무리 부족" }
]

const ELEMENT_COLORS: Record<TarotElement, string> = {
  'Fire': '#FF6B6B',
  'Water': '#4ECDC4',
  'Air': '#95E1D3',
  'Earth': '#DDA15E',
  'Spirit': '#B19CD9'
}

const TAROT_TO_SAJU: Record<TarotElement, string> = {
  'Fire': '화(火)',
  'Water': '수(水)',
  'Air': '목(木)',
  'Earth': '토(土)',
  'Spirit': '금(金)'
}

const ELEMENT_DESCRIPTIONS: Record<TarotElement, string> = {
  'Fire': '열정, 행동력, 창조의 에너지',
  'Water': '감정, 직관, 무의식의 흐름',
  'Air': '사고, 소통, 지성의 힘',
  'Earth': '물질, 안정, 현실의 기반',
  'Spirit': '영성, 변환, 초월의 영역'
}

type GameState = 'select' | 'shuffling' | 'spread' | 'revealing' | 'revealed'
type TarotMode = 'question' | 'today' | 'monthly'

/** TarotCard → 프롬프트용 TarotCardInfo 변환 */
function toCardInfo(card: TarotCard, isReversed: boolean): TarotCardInfo {
  return {
    name: card.name,
    nameKr: card.nameKr,
    element: card.element,
    isReversed,
    keywords: isReversed ? card.keywords.reversed : card.keywords.upright,
    meaning: isReversed ? card.meaningReversed : card.meaning,
  }
}

export default function TarotPage() {
  const [mode, setMode] = useState<TarotMode>('question')

  // === 질문 타로 (기존 플로우) ===
  const [gameState, setGameState] = useState<GameState>('select')
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null)
  const [isReversed, setIsReversed] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shuffledCards, setShuffledCards] = useState<number[]>([])

  // === 오늘/이달 타로 공통 ===
  const [autoCards, setAutoCards] = useState<{ card: TarotCard; isReversed: boolean }[]>([])
  const [autoAnalysis, setAutoAnalysis] = useState('')
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoError, setAutoError] = useState<string | null>(null)
  const [autoStarted, setAutoStarted] = useState(false)

  const { fetchBalance } = useCreditStore()

  useEffect(() => {
    fetchBalance()
  }, [])

  // 모드 전환 시 상태 초기화
  useEffect(() => {
    setAutoCards([])
    setAutoAnalysis('')
    setAutoError(null)
    setAutoStarted(false)
    if (mode === 'question') {
      resetGame()
    }
  }, [mode])

  // 오늘의 타로 자동 실행
  const runTodayTarot = async () => {
    if (autoStarted) return
    setAutoStarted(true)
    setAutoLoading(true)
    setAutoError(null)

    try {
      const key = getTodayKey()
      const { cardIndex, isReversed: rev } = drawOne(key, TAROT_CARDS.length, 0.35)
      const card = TAROT_CARDS[cardIndex]
      setAutoCards([{ card, isReversed: rev }])

      const cardInfo = toCardInfo(card, rev)
      const res = await getTodayTarotReading(cardInfo, formatTodayString())
      if (res.success && res.content) {
        setAutoAnalysis(res.content)
      } else {
        setAutoError(res.error || '오늘의 타로를 불러오지 못했습니다')
      }
    } catch (e: any) {
      setAutoError(e?.message || '오류가 발생했습니다')
    } finally {
      setAutoLoading(false)
    }
  }

  // 이달의 타로 자동 실행 (3장)
  const runMonthlyTarot = async () => {
    if (autoStarted) return
    setAutoStarted(true)
    setAutoLoading(true)
    setAutoError(null)

    try {
      const key = getMonthKey()
      const draws = drawMany(key, 3, TAROT_CARDS.length, 0.35)
      const cards = draws.map(d => ({ card: TAROT_CARDS[d.cardIndex], isReversed: d.isReversed }))
      setAutoCards(cards)

      const [early, middle, late] = cards.map(c => toCardInfo(c.card, c.isReversed))
      const res = await getMonthlyTarotReading({ early, middle, late }, formatMonthString())
      if (res.success && res.content) {
        setAutoAnalysis(res.content)
      } else {
        setAutoError(res.error || '이달의 타로를 불러오지 못했습니다')
      }
    } catch (e: any) {
      setAutoError(e?.message || '오류가 발생했습니다')
    } finally {
      setAutoLoading(false)
    }
  }

  const resetGame = () => {
    setGameState('select')
    setSelectedCard(null)
    setIsReversed(false)
    setAnalysis('')
    setShuffledCards([])
  }

  const shuffleCards = () => {
    setGameState('shuffling')
    const indices = Array.from({ length: 22 }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setShuffledCards(indices)

    setTimeout(() => {
      setGameState('spread')
    }, 1500)
  }

  const handleSelectCard = (index: number) => {
    if (gameState !== 'spread') return

    setGameState('revealing')
    const cardIndex = shuffledCards[index]
    const card = TAROT_CARDS[cardIndex]
    const reversed = Math.random() < 0.35

    setSelectedCard(card)
    setIsReversed(reversed)

    setTimeout(() => {
      setGameState('revealed')
    }, 800)
  }

  const handleAnalysis = async () => {
    if (!selectedCard) return
    if (analysis) return // 이미 분석 완료된 경우

    setIsLoading(true)
    try {
      const keywords = isReversed ? selectedCard.keywords.reversed : selectedCard.keywords.upright
      const meaning = isReversed ? selectedCard.meaningReversed : selectedCard.meaning

      const prompt = generateTarotPrompt({
        name: selectedCard.name,
        nameKr: selectedCard.nameKr,
        element: selectedCard.element,
        isReversed,
        keywords,
        meaning
      })

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          maxTokens: 800,
          systemPrompt: '당신은 30년 경력의 정통 사주명리학 전문가입니다. 동양 철학과 현대 심리학을 결합하여 깊이 있으면서도 따뜻한 상담을 제공합니다. 답변은 한국어로 작성합니다.'
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAnalysis(data.content)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 카드가 드러나면 자동으로 AI 분석 시작
  useEffect(() => {
    if (gameState === 'revealed' && selectedCard && !analysis && !isLoading) {
      handleAnalysis()
    }
  }, [gameState, selectedCard])

  const dateLabel = useMemo(() => {
    if (mode === 'today') return formatTodayString()
    if (mode === 'monthly') return formatMonthString()
    return ''
  }, [mode])

  const modeDescriptions: Record<TarotMode, string> = {
    today: '날짜에 따라 오늘 한 장이 정해집니다 · 🌙 1',
    monthly: '이달의 흐름을 세 장으로 짚어드립니다 · ☀️ 1',
    question: '마음속 질문 하나에 카드가 답합니다 · 🌙 1',
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>타로 상담</h1>
        {mode === 'question' && gameState === 'select' && <p>마음을 비우고 카드를 섞어보세요</p>}
        {mode === 'question' && gameState === 'shuffling' && <p>카드를 섞는 중...</p>}
        {mode === 'question' && gameState === 'spread' && <p>마음이 끌리는 카드를 선택하세요</p>}
        {mode === 'question' && (gameState === 'revealing' || gameState === 'revealed') && <p>당신의 운명이 드러납니다</p>}
        {mode !== 'question' && <p>{modeDescriptions[mode]}</p>}
      </div>

      {/* 모드 선택 탭 */}
      <div style={{
        display: 'flex',
        gap: 6,
        margin: '0 auto 20px',
        maxWidth: 520,
        padding: 4,
        background: 'var(--space-surface)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        {(['today', 'monthly', 'question'] as TarotMode[]).map((m) => {
          const labels: Record<TarotMode, string> = {
            today: '오늘의 타로',
            monthly: '이달의 타로',
            question: '질문 타로',
          }
          const active = mode === m
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--cta-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--text-tertiary)',
                boxShadow: active ? '0 2px 8px rgba(124,92,252,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {labels[m]}
            </button>
          )
        })}
      </div>

      {/* 오늘 / 이달 모드 화면 */}
      {(mode === 'today' || mode === 'monthly') && (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {!autoStarted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '28px 20px',
                background: 'var(--space-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                {dateLabel}
              </p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 18 }}>
                {mode === 'today'
                  ? '오늘 당신에게 정해진 한 장을 펼쳐볼게요. 같은 날짜에는 같은 카드가 나타납니다.'
                  : '이달의 흐름을 상순·중순·하순 세 장으로 짚어드립니다. 이달 안에는 같은 스프레드가 유지됩니다.'}
              </p>
              <motion.button
                className={styles.shuffleBtn}
                onClick={mode === 'today' ? runTodayTarot : runMonthlyTarot}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'today' ? '오늘의 카드 펼치기 · 🌙 1' : '이달의 카드 펼치기 · ☀️ 1'}
              </motion.button>
            </motion.div>
          )}

          {autoStarted && (
            <>
              {/* 카드 카드 라인업 */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 14,
                flexWrap: 'wrap',
                margin: '12px 0 24px',
              }}>
                {autoCards.map((c, idx) => {
                  const labels = mode === 'monthly' ? ['상순', '중순', '하순'] : ['오늘']
                  return (
                    <motion.div
                      key={idx}
                      initial={{ rotateY: 180, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: idx * 0.15 }}
                      style={{
                        width: 108,
                        background: ELEMENT_COLORS[c.card.element] + '22',
                        border: `2px solid ${ELEMENT_COLORS[c.card.element]}`,
                        borderRadius: 12,
                        padding: '10px 8px',
                        textAlign: 'center',
                        transform: c.isReversed ? 'rotate(180deg)' : 'none',
                      }}
                    >
                      <div style={{
                        transform: c.isReversed ? 'rotate(180deg)' : 'none',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                          {labels[idx]}
                        </div>
                        <div style={{ fontSize: 22, color: ELEMENT_COLORS[c.card.element], fontWeight: 700 }}>
                          {c.card.symbol}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                          {c.card.nameKr}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {c.isReversed ? '역방향' : '정방향'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* 분석 영역 */}
              <div className={styles.analysisSection}>
                <h3 className={styles.analysisSectionTitle}>
                  {mode === 'today' ? '🌙 오늘의 리딩' : '☀️ 이달의 리딩'}
                </h3>
                {autoLoading && (
                  <div className={styles.analysisPlaceholder}>
                    <div className={styles.loadingSpinner}></div>
                    <p>카드의 메시지를 풀어내는 중...</p>
                  </div>
                )}
                {autoError && (
                  <div className={styles.analysisPlaceholder}>
                    <p style={{ color: '#f87171' }}>{autoError}</p>
                    <button
                      onClick={mode === 'today' ? runTodayTarot : runMonthlyTarot}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                {autoAnalysis && !autoLoading && (
                  <div className={styles.analysisResult}>
                    <pre>{autoAnalysis}</pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 질문 타로 (기존 플로우) */}
      {mode === 'question' && (
      <div className={styles.mainArea}>
        {gameState === 'select' && (
          <motion.div
            className={styles.selectArea}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.deckPreview}>
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={styles.deckCard}
                  style={{ transform: `translateX(${i * 3}px) translateY(${-i * 3}px)` }}
                />
              ))}
            </div>
            <p className={styles.deckCount}>22장의 메이저 아르카나</p>
            <motion.button
              className={styles.shuffleBtn}
              onClick={shuffleCards}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              카드 섞고 펼치기
            </motion.button>
            <p className={styles.instruction}>
              마음을 가라앉히고<br />
              당신의 질문을 마음속으로 떠올려보세요
            </p>
          </motion.div>
        )}

        {(gameState === 'shuffling' || gameState === 'spread') && (
          <div className={styles.spreadArea}>
            <div className={styles.cardsContainer}>
              {TAROT_CARDS.map((_, index) => (
                <motion.div
                  key={index}
                  className={styles.cardWrapper}
                  initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                  animate={gameState === 'spread' ? {
                    x: (index - 10.5) * 17,
                    y: Math.sin((index - 10.5) * 0.3) * 20,
                    rotate: (index - 10.5) * 2,
                    scale: 1
                  } : {
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 60,
                    rotate: (Math.random() - 0.5) * 30,
                    scale: 1
                  }}
                  transition={{ duration: 0.6, delay: index * 0.025 }}
                  onClick={() => handleSelectCard(index)}
                  whileHover={gameState === 'spread' ? { scale: 1.15, y: -30, zIndex: 10 } : {}}
                >
                  <div className={styles.cardBack}>
                    <div className={styles.cardBackInner}>
                      <span>?</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {(gameState === 'revealing' || gameState === 'revealed') && selectedCard && (
          <motion.div
            className={styles.resultArea}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.selectedCardWrapper}>
              <motion.div
                className={`${styles.cardFront} ${isReversed ? styles.reversed : ''}`}
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.6 }}
                style={{ backgroundColor: ELEMENT_COLORS[selectedCard.element] + '20' }}
              >
                <div className={styles.cardElement} style={{ backgroundColor: ELEMENT_COLORS[selectedCard.element] }}>
                  {selectedCard.element.charAt(0)}
                </div>
                <div className={styles.cardSymbol}>{selectedCard.symbol}</div>
                <div className={styles.cardName}>{selectedCard.nameKr}</div>
                <div className={styles.cardNameEn}>{selectedCard.name}</div>
                {isReversed && <div className={styles.reversedBadge}>역방향</div>}
              </motion.div>
            </div>

            <div className={styles.resultInfo}>
              <div className={styles.resultHeader}>
                <h2>{selectedCard.symbol} · {selectedCard.nameKr}</h2>
                {isReversed && <span className={styles.reversedTag}>역방향</span>}
              </div>
              <p className={styles.resultSubtitle}>{selectedCard.name}</p>

              <div className={styles.elementInfo}>
                <span className={styles.elementBadge} style={{ backgroundColor: ELEMENT_COLORS[selectedCard.element] }}>
                  {selectedCard.element}
                </span>
                <span className={styles.sajuElement}>{TAROT_TO_SAJU[selectedCard.element]}</span>
                <span className={styles.elementDesc}>{ELEMENT_DESCRIPTIONS[selectedCard.element]}</span>
              </div>

              <div className={styles.keywords}>
                {(isReversed ? selectedCard.keywords.reversed : selectedCard.keywords.upright).map((kw, i) => (
                  <span key={i} className={styles.keyword}>{kw}</span>
                ))}
              </div>

              <p className={styles.meaning}>
                {isReversed ? selectedCard.meaningReversed : selectedCard.meaning}
              </p>

              <div className={styles.analysisSection}>
                <h3 className={styles.analysisSectionTitle}>AI 카드 해석</h3>
                {isLoading && (
                  <div className={styles.analysisPlaceholder}>
                    <div className={styles.loadingSpinner}></div>
                    <p>AI가 카드의 의미를 해석하고 있습니다...</p>
                    <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                      동양 오행과 서양 타로의 조화로운 해석을 준비 중입니다
                    </p>
                  </div>
                )}

                {analysis && (
                  <div className={styles.analysisResult}>
                    <pre>{analysis}</pre>
                  </div>
                )}

                {!analysis && !isLoading && (
                  <div className={styles.analysisPlaceholder}>
                    <p>AI 해석을 준비하고 있습니다...</p>
                  </div>
                )}
              </div>

              <motion.button
                className={styles.retryBtn}
                onClick={resetGame}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                다른 카드 뽑기
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
      )}
    </div>
  )
}
