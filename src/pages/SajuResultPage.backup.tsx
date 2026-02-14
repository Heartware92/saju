import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { calculateSaju, SajuResult } from '../utils/sajuCalculator'
import { getCorrectedTimeForSaju } from '../utils/timeCorrection'
import { fetchSajuAnalysis, generateSajuPrompt } from '../services/api'
import { OPENAI_API_KEY } from '../constants/secrets'
import styles from './SajuResultPage.module.css'

type TabType = 'wonguk' | 'daewoon' | 'analysis'

// 카테고리 정의 (앱과 동일)
const SAJU_CATEGORIES: Record<string, { title: string; icon: string }> = {
  'today': { title: '오늘의 운세', icon: '☀️' },
  'tomorrow': { title: '내일의 운세', icon: '🌙' },
  'traditional': { title: '정통 사주', icon: '📜' },
  'newyear': { title: '2026 신년운세', icon: '🐍' },
  'tojeong': { title: '토정비결', icon: '📖' },
  'love': { title: '애정운', icon: '❤️' },
  'wealth': { title: '재물운', icon: '💰' },
  'date': { title: '지정일 운세', icon: '📅' },
}

const ELEMENT_COLORS: Record<string, string> = {
  '목': '#4CAF50',
  '화': '#F44336',
  '토': '#DDA15E',
  '금': '#9E9E9E',
  '수': '#2196F3'
}

export default function SajuResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('wonguk')
  const [result, setResult] = useState<SajuResult | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 카테고리 및 지정일 파라미터 읽기
  const categoryId = searchParams.get('category') || 'traditional'
  const targetDate = searchParams.get('targetDate') || ''
  const category = SAJU_CATEGORIES[categoryId] || SAJU_CATEGORIES['traditional']

  useEffect(() => {
    const year = parseInt(searchParams.get('year') || '1990')
    const month = parseInt(searchParams.get('month') || '1')
    const day = parseInt(searchParams.get('day') || '1')
    const hour = parseInt(searchParams.get('hour') || '12')
    const minute = parseInt(searchParams.get('minute') || '0')
    const gender = (searchParams.get('gender') || 'male') as 'male' | 'female'
    const longitude = parseFloat(searchParams.get('longitude') || '126.978')
    const useTrueSolarTime = searchParams.get('useTrueSolarTime') === 'true'

    let finalHour = hour
    let finalMinute = minute

    if (useTrueSolarTime) {
      const corrected = getCorrectedTimeForSaju(year, month, day, hour, minute, longitude)
      finalHour = corrected.finalHour
      finalMinute = corrected.trueSolarTime.trueSolarTime.getMinutes()
    }

    const sajuResult = calculateSaju(year, month, day, finalHour, finalMinute, gender)
    setResult(sajuResult)
  }, [searchParams])

  const handleAnalysis = async () => {
    if (!result) return
    if (analysis) return // 이미 분석 완료된 경우

    setIsLoading(true)
    try {
      // 카테고리와 지정일을 프롬프트에 전달
      const prompt = generateSajuPrompt(result, categoryId, targetDate)
      const analysisResult = await fetchSajuAnalysis(prompt, OPENAI_API_KEY)
      setAnalysis(analysisResult)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // AI 풀이 탭 선택시 자동 분석 시작
  useEffect(() => {
    if (activeTab === 'analysis' && result && !analysis && !isLoading) {
      handleAnalysis()
    }
  }, [activeTab, result])

  if (!result) {
    return <div className={styles.loading}>로딩 중...</div>
  }

  const { pillars, elementPercent, daeWoon, seWoon, sinSals, interactions } = result

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(`/saju?category=${categoryId}`)}>
          ← 다시 입력
        </button>
        <div className={styles.categoryBadge}>
          <span>{category.icon}</span> {category.title}
        </div>
        <h1>사주 분석 결과</h1>
        <p className={styles.dateInfo}>
          {result.solarDate} (양력) | {result.lunarDateSimple} (음력)
          {targetDate && <span className={styles.targetDateInfo}> | 분석일: {targetDate}</span>}
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'wonguk' ? styles.active : ''}`}
          onClick={() => setActiveTab('wonguk')}
        >
          사주 원국
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'daewoon' ? styles.active : ''}`}
          onClick={() => setActiveTab('daewoon')}
        >
          대운·세운
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          AI 풀이
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className={styles.content}>
        {activeTab === 'wonguk' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* 사주 원국표 */}
            <div className={styles.section}>
              <h2>📜 사주 원국 (만세력)</h2>
              <div className={styles.pillarsTable}>
                <div className={styles.pillarsHeader}>
                  <span>시주</span>
                  <span>일주</span>
                  <span>월주</span>
                  <span>년주</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>십성</span>
                  <span>{pillars.hour.tenGodGan}</span>
                  <span className={styles.highlight}>일주</span>
                  <span>{pillars.month.tenGodGan}</span>
                  <span>{pillars.year.tenGodGan}</span>
                </div>
                <div className={`${styles.pillarsRow} ${styles.stemRow}`}>
                  <span className={styles.label}>천간</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.hour.ganElement] }}>{pillars.hour.gan}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.day.ganElement] }}>{pillars.day.gan}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.month.ganElement] }}>{pillars.month.gan}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.year.ganElement] }}>{pillars.year.gan}</span>
                </div>
                <div className={`${styles.pillarsRow} ${styles.branchRow}`}>
                  <span className={styles.label}>지지</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.hour.zhiElement] }}>{pillars.hour.zhi}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.day.zhiElement] }}>{pillars.day.zhi}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.month.zhiElement] }}>{pillars.month.zhi}</span>
                  <span style={{ color: ELEMENT_COLORS[pillars.year.zhiElement] }}>{pillars.year.zhi}</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>지장간</span>
                  <span className={styles.hiddenStems}>{pillars.hour.hiddenStems.join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.day.hiddenStems.join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.month.hiddenStems.join(' ')}</span>
                  <span className={styles.hiddenStems}>{pillars.year.hiddenStems.join(' ')}</span>
                </div>
                <div className={styles.pillarsRow}>
                  <span className={styles.label}>12운성</span>
                  <span>{pillars.hour.twelveStage}</span>
                  <span>{pillars.day.twelveStage}</span>
                  <span>{pillars.month.twelveStage}</span>
                  <span>{pillars.year.twelveStage}</span>
                </div>
              </div>
            </div>

            {/* 오행 분포 */}
            <div className={styles.section}>
              <h2>⚖️ 오행 분포</h2>
              <div className={styles.elementChart}>
                {Object.entries(elementPercent).map(([element, percent]) => (
                  <div key={element} className={styles.elementBar}>
                    <div className={styles.elementLabel}>
                      <span style={{ color: ELEMENT_COLORS[element] }}>{element}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className={styles.barContainer}>
                      <motion.div
                        className={styles.bar}
                        style={{ backgroundColor: ELEMENT_COLORS[element] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 신강/신약 */}
            <div className={styles.section}>
              <h2>💪 신강/신약 판정</h2>
              <div className={styles.strengthBox}>
                <div className={styles.strengthBadge} data-strong={result.isStrong}>
                  {result.isStrong ? '신강' : '신약'} ({result.strengthScore}점)
                </div>
                <p>{result.strengthAnalysis}</p>
              </div>
            </div>

            {/* 용신 */}
            <div className={styles.section}>
              <h2>🎯 용신/희신/기신</h2>
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
            </div>

            {/* 신살 */}
            {sinSals.length > 0 && (
              <div className={styles.section}>
                <h2>✨ 신살</h2>
                <div className={styles.sinsalList}>
                  {sinSals.map((sinsal, idx) => (
                    <div key={idx} className={styles.sinsalItem} data-type={sinsal.type}>
                      <span className={styles.sinsalName}>{sinsal.name}</span>
                      <span className={styles.sinsalDesc}>{sinsal.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 합충형파해 */}
            {interactions.length > 0 && (
              <div className={styles.section}>
                <h2>🔄 합충형파해</h2>
                <div className={styles.interactionList}>
                  {interactions.map((inter, idx) => (
                    <div key={idx} className={styles.interactionItem} data-type={inter.type}>
                      <span className={styles.interType}>{inter.type}</span>
                      <span className={styles.interDesc}>{inter.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'daewoon' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* 대운 */}
            <div className={styles.section}>
              <h2>📈 대운 (10년 주기)</h2>
              <p className={styles.subInfo}>대운 시작: {result.daeWoonStartAge}세</p>
              <div className={styles.daewoonScroll}>
                {daeWoon.slice(0, 10).map((dw, idx) => (
                  <div key={idx} className={styles.daewoonCard}>
                    <div className={styles.dwAge}>{dw.startAge}~{dw.endAge}세</div>
                    <div className={styles.dwGanZhi}>
                      <span style={{ color: ELEMENT_COLORS[dw.ganElement] }}>{dw.gan}</span>
                      <span style={{ color: ELEMENT_COLORS[dw.zhiElement] }}>{dw.zhi}</span>
                    </div>
                    <div className={styles.dwInfo}>
                      <span>{dw.tenGod}</span>
                      <span>{dw.twelveStage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 세운 */}
            <div className={styles.section}>
              <h2>📅 세운 (연운)</h2>
              <div className={styles.sewoonGrid}>
                {seWoon.map((sw, idx) => (
                  <div
                    key={idx}
                    className={`${styles.sewoonCard} ${idx === 0 ? styles.current : ''}`}
                  >
                    <div className={styles.swYear}>{sw.year}년</div>
                    <div className={styles.swAnimal}>{sw.animal}띠</div>
                    <div className={styles.swGanZhi}>
                      <span style={{ color: ELEMENT_COLORS[sw.ganElement] }}>{sw.gan}</span>
                      <span style={{ color: ELEMENT_COLORS[sw.zhiElement] }}>{sw.zhi}</span>
                    </div>
                    <div className={styles.swInfo}>
                      <span>{sw.tenGod}</span>
                      <span>{sw.twelveStage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.section}>
              <h2>🤖 AI 사주 풀이</h2>

              {isLoading && (
                <div className={styles.analysisPlaceholder}>
                  <div className={styles.loadingSpinner}></div>
                  <p>🔮 AI가 당신의 사주를 분석하고 있습니다...</p>
                  <p className={styles.hint}>잠시만 기다려주세요</p>
                </div>
              )}

              {analysis && (
                <div className={styles.analysisResult}>
                  <pre>{analysis}</pre>
                </div>
              )}

              {!analysis && !isLoading && (
                <div className={styles.analysisPlaceholder}>
                  <p>🔮 AI 분석을 불러오는 중...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
