import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './HomePage.module.css'

// 운세 카테고리 정의 (앱과 동일)
const SAJU_CATEGORIES = [
  { id: 'today', title: '오늘의 운세', icon: '☀️', desc: '하루의 흐름 미리보기' },
  { id: 'tomorrow', title: '내일의 운세', icon: '🌙', desc: '미리 준비하는 내일' },
  { id: 'traditional', title: '정통 사주', icon: '📜', desc: '나의 타고난 명운 분석' },
  { id: 'newyear', title: '2026 신년운세', icon: '🐍', desc: '병오년 청뱀띠 총운' },
  { id: 'tojeong', title: '토정비결', icon: '📖', desc: '한 해의 길흉화복' },
  { id: 'love', title: '애정운', icon: '❤️', desc: '나의 인연과 연애 스타일' },
  { id: 'wealth', title: '재물운', icon: '💰', desc: '재물 모으는 법과 시기' },
  { id: 'date', title: '지정일 운세', icon: '📅', desc: '중요한 날의 기운 확인' },
]

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* 히어로 섹션 */}
      <motion.div
        className={styles.hero}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.heroIcon}>☯</div>
        <h1 className={styles.heroTitle}>2026 병오년</h1>
        <p className={styles.heroSubtitle}>
          당신의 운명을 비추는 청뱀의 해
        </p>
      </motion.div>

      {/* 운세 카테고리 그리드 */}
      <motion.div
        className={styles.categorySection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className={styles.sectionTitle}>운세 카테고리</h2>
        <div className={styles.categoryGrid}>
          {SAJU_CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
            >
              <Link
                to={`/saju?category=${cat.id}`}
                className={styles.categoryCard}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryTitle}>{cat.title}</span>
                <span className={styles.categoryDesc}>{cat.desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 타로 배너 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Link to="/tarot" className={styles.tarotBanner}>
          <span className={styles.tarotIcon}>🔮</span>
          <div className={styles.tarotText}>
            <span className={styles.tarotTitle}>타로 상담실</span>
            <span className={styles.tarotDesc}>카드가 들려주는 신비로운 조언</span>
          </div>
          <span className={styles.tarotArrow}>→</span>
        </Link>
      </motion.div>
    </div>
  )
}
