'use client';

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CITY_COORDINATES } from '../utils/timeCorrection'
import styles from './SajuInputPage.module.css'

type Gender = 'male' | 'female'
type CalendarType = 'solar' | 'lunar'

// 카테고리 정의 (앱과 동일)
const SAJU_CATEGORIES: Record<string, { title: string; icon: string; desc: string }> = {
  'today': { title: '오늘의 운세', icon: '☀️', desc: '하루의 흐름 미리보기' },
  'tomorrow': { title: '내일의 운세', icon: '🌙', desc: '미리 준비하는 내일' },
  'traditional': { title: '정통 사주', icon: '📜', desc: '나의 타고난 명운 분석' },
  'newyear': { title: '2026 신년운세', icon: '🐍', desc: '병오년 청뱀띠 총운' },
  'tojeong': { title: '토정비결', icon: '📖', desc: '한 해의 길흉화복' },
  'love': { title: '애정운', icon: '❤️', desc: '나의 인연과 연애 스타일' },
  'wealth': { title: '재물운', icon: '💰', desc: '재물 모으는 법과 시기' },
  'date': { title: '지정일 운세', icon: '📅', desc: '중요한 날의 기운 확인' },
}

export default function SajuInputPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams?.get('category') || 'traditional'
  const category = SAJU_CATEGORIES[categoryId] || SAJU_CATEGORIES['traditional']

  const currentYear = new Date().getFullYear()

  const [gender, setGender] = useState<Gender>('male')
  const [calendarType, setCalendarType] = useState<CalendarType>('solar')
  const [year, setYear] = useState(1990)
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState(0)
  const [unknownTime, setUnknownTime] = useState(false)
  const [birthPlace, setBirthPlace] = useState('seoul')
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(true)
  const [targetDate, setTargetDate] = useState('')

  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  // 카테고리별로 도시 그룹화
  const citiesByCategory = useMemo(() => {
    return Object.entries(CITY_COORDINATES).reduce((acc, [key, value]) => {
      const cat = value.category || '기타'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ key, name: value.name })
      return acc
    }, {} as Record<string, { key: string; name: string }[]>)
  }, [])

  const categoryOrder = ['대한민국', '북한', '아시아', '북미', '유럽', '오세아니아']

  const handleSubmit = () => {
    // 지정일 운세의 경우 날짜 검증
    if (categoryId === 'date' && !targetDate) {
      alert('확인하고 싶은 날짜를 입력해주세요.')
      return
    }

    const coords = CITY_COORDINATES[birthPlace] || CITY_COORDINATES['seoul']

    const queryParams = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
      day: day.toString(),
      hour: unknownTime ? '12' : hour.toString(),
      minute: unknownTime ? '0' : minute.toString(),
      gender,
      calendarType,
      longitude: coords.lng.toString(),
      useTrueSolarTime: useTrueSolarTime.toString(),
      unknownTime: unknownTime.toString(),
      category: categoryId,
      ...(targetDate && { targetDate })
    })

    router.push(`/saju/result?${queryParams.toString()}`)
  }

  return (
    <div className={styles.container}>
      {/* 카테고리 헤더 */}
      <motion.div
        className={styles.categoryHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className={styles.categoryIcon}>{category.icon}</span>
        <h1 className={styles.categoryTitle}>{category.title}</h1>
        <p className={styles.categoryDesc}>{category.desc}</p>
      </motion.div>

      <motion.div
        className={styles.form}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 성별 선택 */}
        <div className={styles.section}>
          <label className={styles.label}>성별</label>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleBtn} ${gender === 'male' ? styles.active : ''}`}
              onClick={() => setGender('male')}
            >
              <span>👨</span> 남성
            </button>
            <button
              className={`${styles.toggleBtn} ${gender === 'female' ? styles.active : ''}`}
              onClick={() => setGender('female')}
            >
              <span>👩</span> 여성
            </button>
          </div>
        </div>

        {/* 양력/음력 선택 */}
        <div className={styles.section}>
          <label className={styles.label}>양력/음력</label>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleBtn} ${calendarType === 'solar' ? styles.active : ''}`}
              onClick={() => setCalendarType('solar')}
            >
              ☀️ 양력
            </button>
            <button
              className={`${styles.toggleBtn} ${calendarType === 'lunar' ? styles.active : ''}`}
              onClick={() => setCalendarType('lunar')}
            >
              🌙 음력
            </button>
          </div>
        </div>

        {/* 생년월일 */}
        <div className={styles.section}>
          <label className={styles.label}>생년월일</label>
          <div className={styles.dateRow}>
            <select
              className={styles.select}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {months.map(m => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            >
              {days.map(d => (
                <option key={d} value={d}>{d}일</option>
              ))}
            </select>
          </div>
        </div>

        {/* 출생 시간 */}
        <div className={styles.section}>
          <div className={styles.labelRow}>
            <label className={styles.label}>출생 시간</label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={unknownTime}
                onChange={(e) => setUnknownTime(e.target.checked)}
              />
              <span>모름</span>
            </label>
          </div>
          <div className={styles.timeRow}>
            <select
              className={styles.select}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              disabled={unknownTime}
            >
              {hours.map(h => (
                <option key={h} value={h}>{h}시</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              disabled={unknownTime}
            >
              {minutes.map(m => (
                <option key={m} value={m}>{m}분</option>
              ))}
            </select>
          </div>
          {unknownTime && (
            <p className={styles.hint}>
              시간을 모르면 시주(時柱)가 정확하지 않을 수 있습니다
            </p>
          )}
        </div>

        {/* 출생지 */}
        <div className={styles.section}>
          <label className={styles.label}>출생지</label>
          <select
            className={styles.select}
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
          >
            {categoryOrder.map(cat => (
              citiesByCategory[cat] && (
                <optgroup key={cat} label={cat}>
                  {citiesByCategory[cat].map(city => (
                    <option key={city.key} value={city.key}>{city.name}</option>
                  ))}
                </optgroup>
              )
            ))}
          </select>
          <p className={styles.hint}>
            진태양시 보정에 출생지 경도가 사용됩니다
          </p>
        </div>

        {/* 지정일 운세 전용: 날짜 입력 */}
        {categoryId === 'date' && (
          <div className={`${styles.section} ${styles.targetDateSection}`}>
            <label className={styles.labelHighlight}>📅 언제의 운세가 궁금하신가요?</label>
            <input
              type="date"
              className={styles.dateInput}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <p className={styles.hint}>
              확인하고 싶은 날짜를 선택해주세요
            </p>
          </div>
        )}

        {/* 진태양시 옵션 */}
        <div className={styles.section}>
          <label className={styles.checkboxFull}>
            <input
              type="checkbox"
              checked={useTrueSolarTime}
              onChange={(e) => setUseTrueSolarTime(e.target.checked)}
            />
            <span>진태양시 보정 적용</span>
          </label>
          <p className={styles.hint}>
            경도 보정과 균시차를 적용하여 정확한 시주를 계산합니다
          </p>
        </div>

        {/* 제출 버튼 */}
        <motion.button
          className={styles.submitBtn}
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {category.title} 결과 보기
        </motion.button>

        {/* 뒤로가기 */}
        <button
          className={styles.backBtn}
          onClick={() => router.push('/')}
        >
          ← 다른 운세 보기
        </button>
      </motion.div>
    </div>
  )
}
