import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fetchSajuAnalysis, generateTarotPrompt, TarotElement } from '../services/api'
import { OPENAI_API_KEY } from '../constants/secrets'
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

export default function TarotPage() {
  const [gameState, setGameState] = useState<GameState>('select')
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null)
  const [isReversed, setIsReversed] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shuffledCards, setShuffledCards] = useState<number[]>([])

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

      const result = await fetchSajuAnalysis(prompt, OPENAI_API_KEY)
      setAnalysis(result)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎴 타로 상담소</h1>
        {gameState === 'select' && <p>마음을 비우고 카드를 섞어보세요</p>}
        {gameState === 'shuffling' && <p>카드를 섞는 중...</p>}
        {gameState === 'spread' && <p>마음이 끌리는 카드를 선택하세요</p>}
        {(gameState === 'revealing' || gameState === 'revealed') && <p>당신의 운명이 드러납니다</p>}
      </div>

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
                    x: (index - 10.5) * 45,
                    y: Math.sin((index - 10.5) * 0.3) * 30,
                    rotate: (index - 10.5) * 2.5,
                    scale: 1
                  } : {
                    x: (Math.random() - 0.5) * 150,
                    y: (Math.random() - 0.5) * 80,
                    rotate: (Math.random() - 0.5) * 40,
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
    </div>
  )
}
