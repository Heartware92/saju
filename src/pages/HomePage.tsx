'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import {
  getCharacterFromStem,
  pillarToHanja,
  STEM_TO_ELEMENT,
} from '../lib/character';

/**
 * 운세 서비스 목록
 * - 메인 2x2: 신년운세 / 정통사주 / 오늘의 운세 / 지정일 운세
 * - 메인 하단 1x2: 토정비결 / 자미두수
 * - 서브 (작은 칩): 애정운 / 재물운 / 타로
 */
const CURRENT_YEAR = new Date().getFullYear();

const MAIN_SERVICES = [
  {
    id: 'newyear',
    title: `${CURRENT_YEAR} 신년운세`,
    desc: '한 해의 흐름',
    direct: '/saju/newyear',
    gradient: 'from-rose-500/20 to-pink-500/10',
  },
  {
    id: 'traditional',
    title: '정통 사주',
    desc: '사주팔자 종합 분석',
    direct: '/saju',
    gradient: 'from-purple-500/20 to-indigo-500/10',
  },
  {
    id: 'today',
    title: '오늘의 운세',
    desc: '오늘 하루 운세',
    direct: '/saju/today',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 'date',
    title: '지정일 운세',
    desc: '특정 날짜의 운세',
    direct: '/saju/date',
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
];

const SECONDARY_SERVICES = [
  {
    id: 'tojeong',
    title: '토정비결',
    desc: '한 해 길흉화복',
    direct: '/saju/tojeong',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'zamidusu',
    title: '자미두수',
    desc: '별자리 명리',
    direct: '/saju/zamidusu',
    gradient: 'from-violet-500/20 to-fuchsia-500/10',
  },
];

// 모든 서비스 버튼은 결과 페이지로 직행한다.
// 대표 프로필이 없으면 결과 페이지 자체에서 "프로필 등록" 안내가 표시된다.

const SUB_SERVICES = [
  { id: 'love',   title: '애정운', href: '/saju/input?category=love' },
  { id: 'wealth', title: '재물운', href: '/saju/input?category=wealth' },
  { id: 'tarot',  title: '타로',   href: '/tarot' },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function HomePage() {
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  // 대표 프로필
  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? null,
    [profiles],
  );

  // 대표 프로필 만세력 계산 — 음력/양력 변환은 헬퍼에서 일관 처리
  const sajuData = useMemo(() => {
    if (!primary) return null;
    const result = computeSajuFromProfile(primary);
    if (!result) return null;
    const dayStem = result.pillars.day.gan;
    const element = STEM_TO_ELEMENT[dayStem];
    const character = getCharacterFromStem(dayStem);
    return { pillars: result.pillars, element, character, unknownTime: result.hourUnknown };
  }, [primary]);

  return (
    <div className="min-h-screen">
      {/* Hero — 대표 프로필 상태에 따라 분기 */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-10 pb-8">

          {/* CASE 1: 대표 프로필 없음 → 등록 유도 */}
          {!primary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Link href="/saju/input" className="block">
                <div className="relative mx-auto w-full max-w-[340px] rounded-2xl px-6 py-8
                                bg-gradient-to-br from-[rgba(124,92,252,0.18)] to-[rgba(201,166,255,0.08)]
                                border border-[var(--border-subtle)] hover:border-cta/50
                                transition-all active:scale-[0.98]">
                  <div className="mx-auto w-16 h-16 mb-3 rounded-full bg-[rgba(20,12,38,0.6)]
                                  border border-cta/30 flex items-center justify-center text-2xl">
                    ✨
                  </div>
                  <h2
                    className="text-lg font-bold text-text-primary mb-1 tracking-tight"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    대표 프로필을 선택하세요
                  </h2>
                  <p className="text-xs text-text-secondary">
                    생년월일을 등록하면 당신의 캐릭터와 만세력을 볼 수 있어요
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-cta">
                    프로필 등록하기
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* CASE 2: 대표 프로필 있음 → 캐릭터 + 만세력 */}
          {primary && sajuData && sajuData.character && (
            <>
              {/* 캐릭터 이미지 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mb-3"
              >
                <div className="relative w-28 h-28 mx-auto">
                  {/* 오행 색 글로우 */}
                  <div
                    className="absolute inset-[-8px] rounded-full blur-xl"
                    style={{ backgroundColor: sajuData.character.colorGlow }}
                  />
                  {/* 내부 원 */}
                  <div className="absolute inset-0 rounded-full overflow-hidden
                                  bg-[rgba(20,12,38,0.85)] border border-[var(--border-subtle)]
                                  flex items-center justify-center">
                    {!imgError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sajuData.character.image}
                        alt={sajuData.character.label}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <span className="text-5xl">{sajuData.character.emoji}</span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 이름 · 오행 */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-5"
              >
                <h1
                  className="text-xl font-bold text-text-primary tracking-tight mb-1"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {primary.name}
                </h1>
                <p className="text-sm font-medium text-text-secondary mb-2">
                  <span style={{ color: sajuData.character.colorMain }}>
                    {sajuData.character.hanjaElement}
                  </span>
                  {' · '}
                  {sajuData.character.label}
                </p>
                <p className="text-[13px] text-text-secondary mb-2 italic" style={{ fontFamily: 'var(--font-serif)' }}>
                  "{sajuData.character.tagline}"
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {sajuData.character.traits.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-0.5 rounded-full border"
                      style={{
                        color: sajuData.character!.colorMain,
                        borderColor: `${sajuData.character!.colorMain}55`,
                        backgroundColor: `${sajuData.character!.colorMain}15`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* 만세력 — 4기둥 한자 */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-[340px]"
              >
                <div className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)]
                                border border-[var(--border-subtle)] backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                      만세력
                    </span>
                    <Link
                      href="/saju/profile"
                      className="text-[11px] font-medium text-cta hover:underline"
                    >
                      프로필 관리
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {[
                      { label: '시', pillar: sajuData.pillars.hour, unknown: sajuData.unknownTime },
                      { label: '일', pillar: sajuData.pillars.day, unknown: false },
                      { label: '월', pillar: sajuData.pillars.month, unknown: false },
                      { label: '년', pillar: sajuData.pillars.year, unknown: false },
                    ].map((col) => (
                      <div
                        key={col.label}
                        className="rounded-xl bg-[rgba(20,12,38,0.6)]
                                   border border-[var(--border-subtle)] p-2 text-center"
                      >
                        <div className="text-[10px] font-medium text-text-tertiary mb-1">
                          {col.label}
                        </div>
                        {col.unknown ? (
                          <div className="text-lg font-bold text-text-tertiary"
                               style={{ fontFamily: 'var(--font-serif)' }}>
                            ?
                          </div>
                        ) : (
                          <>
                            <div
                              className="text-xl font-bold leading-tight"
                              style={{ fontFamily: 'var(--font-serif)' }}
                            >
                              {pillarToHanja(col.pillar.gan, col.pillar.zhi)
                                .split('')
                                .map((char, i) => (
                                  <div key={i} className="leading-tight text-text-primary">
                                    {char}
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 만세력 보기 버튼 */}
                  <Link
                    href="/saju/manseryeok"
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl
                               bg-[rgba(124,92,252,0.15)] border border-cta/30
                               text-[13px] font-semibold text-cta
                               hover:bg-[rgba(124,92,252,0.22)] active:scale-[0.98] transition-all"
                  >
                    만세력 보기
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </>
          )}

        </div>
      </section>

      {/* 핵심 서비스 - 2x2 카드 (신년/정통/오늘/지정일) */}
      <section className="px-4 -mt-3 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-2.5"
        >
          {MAIN_SERVICES.map((svc) => (
            <motion.div key={svc.id} variants={fadeUp}>
              <Link href={svc.direct}>
                <div className={`
                  relative rounded-xl p-3 h-[88px]
                  bg-gradient-to-br ${svc.gradient}
                  border border-[var(--border-subtle)]
                  hover:border-cta/40 transition-all
                  flex flex-col items-center justify-center text-center gap-1
                  active:scale-[0.97]
                `}>
                  <h3 className="text-[15px] font-bold text-text-primary tracking-tight">{svc.title}</h3>
                  <p className="text-[11px] font-medium text-text-secondary">{svc.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 보조 핵심 서비스 - 1x2 (토정비결 / 자미두수) */}
      <section className="px-4 mt-2.5 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-2.5"
        >
          {SECONDARY_SERVICES.map((svc) => (
            <motion.div key={svc.id} variants={fadeUp}>
              <Link href={svc.direct}>
                <div className={`
                  relative rounded-xl p-3 h-[88px]
                  bg-gradient-to-br ${svc.gradient}
                  border border-[var(--border-subtle)]
                  hover:border-cta/40 transition-all
                  flex flex-col items-center justify-center text-center gap-1
                  active:scale-[0.97]
                `}>
                  <h3 className="text-[15px] font-bold text-text-primary tracking-tight">{svc.title}</h3>
                  <p className="text-[11px] font-medium text-text-secondary">{svc.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 추가 서비스 - 작은 칩 */}
      <section className="px-4 mt-5">
        <h2 className="text-base font-bold text-text-primary mb-3 px-1">더 많은 운세</h2>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-2"
        >
          {SUB_SERVICES.map((svc) => (
            <motion.div key={svc.id} variants={fadeUp}>
              <Link href={svc.href}>
                <div className="flex items-center justify-center h-[52px] p-2 rounded-xl bg-space-surface/60 border border-[var(--border-subtle)] hover:border-cta/40 transition-all active:scale-[0.95]">
                  <span className="text-[13px] font-bold text-text-primary">{svc.title}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 타로 배너 */}
      <section className="px-4 mt-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/tarot">
            <Card hover padding="none" glow="cta" className="overflow-hidden">
              <div className="relative px-5 py-5 bg-gradient-to-br from-[rgba(232,164,144,0.18)] to-[rgba(201,166,255,0.1)]">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary mb-0.5 tracking-tight">타로 상담실</h3>
                    <p className="text-sm font-medium text-text-secondary">카드가 전하는 오늘의 한 문장</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      </section>

      {/* 하단 CTA */}
      <section className="px-4 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-6"
        >
          <p className="text-sm font-medium text-text-secondary mb-3">아직 사주를 모르시나요?</p>
          <Link href="/saju">
            <Button variant="outline" size="md">
              무료 사주 계산
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
