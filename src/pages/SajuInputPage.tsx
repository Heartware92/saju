'use client';

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CITY_COORDINATES } from '../utils/timeCorrection'
import { useProfileStore } from '../store/useProfileStore'
import { useUserStore } from '../store/useUserStore'
import type { BirthProfile } from '../types/credit'
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
  'zamidusu': { title: '자미두수', icon: '🌌', desc: '북두칠성과 12궁으로 보는 명운' },
  'love': { title: '애정운', icon: '❤️', desc: '나의 인연과 연애 스타일' },
  'wealth': { title: '재물운', icon: '💰', desc: '재물 모으는 법과 시기' },
  'date': { title: '지정일 운세', icon: '📅', desc: '중요한 날의 기운 확인' },
}

export default function SajuInputPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams?.get('category') || 'traditional'
  const category = SAJU_CATEGORIES[categoryId] || SAJU_CATEGORIES['traditional']
  // 프로필 관리 페이지에서 "+ 새 프로필 추가" 로 진입한 경우.
  // 분석 결과로 라우팅하지 않고 프로필만 저장 후 목록으로 복귀.
  const isProfileOnly = searchParams?.get('mode') === 'profile-only'

  const currentYear = new Date().getFullYear()
  const { user } = useUserStore()
  const { profiles, fetchProfiles, addProfile, updateProfile, deleteProfile } = useProfileStore()

  const [gender, setGender] = useState<Gender>('male')
  const [calendarType, setCalendarType] = useState<CalendarType>('solar')
  const [year, setYear] = useState(1990)
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState(0)
  const [unknownTime, setUnknownTime] = useState(false)
  const [birthPlace, setBirthPlace] = useState('seoul')
  const [targetDate, setTargetDate] = useState('')

  // 프로필 관련
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BirthProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: '',
    memo: '',
  })

  useEffect(() => {
    if (user) {
      fetchProfiles()
    }
  }, [user])

  // 프로필 저장 전용 모드로 진입한 비로그인 사용자는 로그인 페이지로
  // — 일반 체험(사주 계산만)은 기존처럼 허용
  useEffect(() => {
    if (!user && isProfileOnly) {
      router.replace(`/login?from=${encodeURIComponent('/saju/input?mode=profile-only')}`)
    }
  }, [user, isProfileOnly, router])

  // 프로필 선택 시 폼에 반영
  const selectProfile = (profile: BirthProfile) => {
    setSelectedProfileId(profile.id)
    const [y, m, d] = profile.birth_date.split('-').map(Number)
    setYear(y)
    setMonth(m)
    setDay(d)
    setGender(profile.gender)
    setCalendarType(profile.calendar_type)
    setBirthPlace(profile.birth_place || 'seoul')

    if (profile.birth_time) {
      const [h, min] = profile.birth_time.split(':').map(Number)
      setHour(h)
      setMinute(min)
      setUnknownTime(false)
    } else {
      setUnknownTime(true)
    }
  }

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) return

    const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const birthTime = unknownTime ? undefined : `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    const birthLongitude = CITY_COORDINATES[birthPlace]?.lng ?? null;

    if (editingProfile) {
      await updateProfile(editingProfile.id, {
        name: profileForm.name.trim(),
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace,
        longitude: birthLongitude,
        gender,
        calendar_type: calendarType,
        memo: profileForm.memo || undefined,
      })
    } else {
      const created = await addProfile({
        name: profileForm.name.trim(),
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace,
        longitude: birthLongitude,
        gender,
        calendar_type: calendarType,
        is_primary: profiles.length === 0,
        memo: profileForm.memo || undefined,
      })
      if (created) setSelectedProfileId(created.id)
    }

    setShowProfileModal(false)
    setEditingProfile(null)
    setProfileForm({ name: '', memo: '' })

    // 프로필 저장 전용 모드: 저장 직후 프로필 목록으로 복귀
    // replace — 저장 완료된 폼이 history에 남으면 뒤로가기 시 빈 폼으로 돌아가는 UX 버그 발생
    if (isProfileOnly) {
      router.replace('/saju/profile')
    }
  }

  const handleEditProfile = (profile: BirthProfile) => {
    setEditingProfile(profile)
    setProfileForm({ name: profile.name, memo: profile.memo || '' })
    selectProfile(profile)
    setShowProfileModal(true)
  }

  const handleDeleteProfile = async (id: string) => {
    await deleteProfile(id)
    if (selectedProfileId === id) setSelectedProfileId(null)
  }

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
      unknownTime: unknownTime.toString(),
      category: categoryId,
      ...(targetDate && { targetDate })
    })

    // 카테고리별 결과 페이지 분기
    let target = '/saju/result';
    if (categoryId === 'tojeong') target = '/saju/tojeong';
    else if (categoryId === 'zamidusu') target = '/saju/zamidusu';
    else if (categoryId === 'newyear') target = '/saju/newyear';
    else if (categoryId === 'today') target = '/saju/today';
    else if (categoryId === 'date') target = '/saju/date';

    // 지정일 운세는 targetDate 를 date 파라미터로 전달
    if (categoryId === 'date' && targetDate) {
      queryParams.set('date', targetDate);
    }
    // 신년운세는 현재 연도 고정
    if (categoryId === 'newyear') {
      queryParams.set('year', String(currentYear));
    }

    router.push(`${target}?${queryParams.toString()}`)
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
        {/* 저장된 프로필 선택 */}
        {user && (
          <div className={styles.profileSection}>
            <div className={styles.profileLabel}>
              <span>저장된 프로필</span>
            </div>
            <div className={styles.profileList}>
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`${styles.profileCard} ${selectedProfileId === profile.id ? styles.selected : ''}`}
                  onClick={() => selectProfile(profile)}
                  onDoubleClick={() => handleEditProfile(profile)}
                  title="더블클릭으로 수정"
                >
                  <div className={styles.profileName}>{profile.name}</div>
                  <div className={styles.profileInfo}>
                    {profile.birth_date.replace(/-/g, '.')}
                  </div>
                </div>
              ))}
              <button
                className={styles.profileNewCard}
                onClick={() => {
                  setEditingProfile(null)
                  setProfileForm({ name: '', memo: '' })
                  setShowProfileModal(true)
                }}
              >
                <span style={{ fontSize: 20 }}>+</span>
                <span>추가</span>
              </button>
            </div>
          </div>
        )}

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

        {/* 제출 버튼 */}
        <motion.button
          className={styles.submitBtn}
          onClick={() => {
            if (isProfileOnly) {
              setEditingProfile(null)
              setProfileForm({ name: '', memo: '' })
              setShowProfileModal(true)
            } else {
              handleSubmit()
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProfileOnly ? '프로필 저장' : `${category.title} 결과 보기`}
        </motion.button>

        {/* 뒤로가기 */}
        <button
          className={styles.backBtn}
          onClick={() => router.push(isProfileOnly ? '/saju/profile' : '/saju')}
        >
          ← {isProfileOnly ? '프로필 관리로' : '프로필 목록으로'}
        </button>
      </motion.div>

      {/* 프로필 저장 모달 */}
      {showProfileModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingProfile ? '프로필 수정' : '새 프로필 저장'}
            </h2>

            <div className={styles.section}>
              <label className={styles.label}>프로필 이름</label>
              <input
                className={styles.profileInput}
                placeholder="예: 나, 엄마, 친구 민수"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>메모 (선택)</label>
              <input
                className={styles.profileInput}
                placeholder="메모"
                value={profileForm.memo}
                onChange={(e) => setProfileForm(prev => ({ ...prev, memo: e.target.value }))}
              />
            </div>

            <p className={styles.hint} style={{ marginBottom: 12 }}>
              현재 입력된 생년월일/시간/성별/출생지가 프로필로 저장됩니다
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => {
                  setShowProfileModal(false)
                  setEditingProfile(null)
                }}
              >
                취소
              </button>
              {editingProfile && (
                <button
                  className={styles.modalBtnDanger}
                  onClick={() => {
                    handleDeleteProfile(editingProfile.id)
                    setShowProfileModal(false)
                    setEditingProfile(null)
                  }}
                >
                  삭제
                </button>
              )}
              <button
                className={styles.modalBtnPrimary}
                onClick={handleSaveProfile}
                disabled={!profileForm.name.trim()}
              >
                {editingProfile ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
