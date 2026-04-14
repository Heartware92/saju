'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

/**
 * 운세 서비스 목록 (포스텔러/점신/헬로봇 레퍼런스)
 * - 정통사주, 오늘의 운세, 토정비결, 날짜별 운세 (핵심 4종)
 * - 애정운, 재물운, 타로 (추가)
 */
const MAIN_SERVICES = [
  {
    id: 'traditional',
    title: '정통 사주',
    desc: '사주팔자 종합 분석',
    href: '/saju',
    gradient: 'from-purple-500/20 to-indigo-500/10',
  },
  {
    id: 'today',
    title: '오늘의 운세',
    desc: '오늘 하루 운세',
    href: '/saju/input?category=today',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 'tojeong',
    title: '토정비결',
    desc: '한 해 길흉화복',
    href: '/saju/input?category=tojeong',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'date-fortune',
    title: '지정일 운세',
    desc: '특정 날짜의 운세',
    href: '/saju/input?category=date',
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
];

const SUB_SERVICES = [
  { id: 'zamidusu', title: '자미두수', href: '/saju/input?category=zamidusu' },
  { id: 'love',     title: '애정운',   href: '/saju/input?category=love' },
  { id: 'wealth',   title: '재물운',   href: '/saju/input?category=wealth' },
  { id: 'tarot',    title: '타로',     href: '/tarot' },
  { id: 'newyear',  title: '신년운세', href: '/saju/input?category=newyear' },
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
  return (
    <div className="min-h-screen">
      {/* Hero - 간결하게 */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-14 pb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-5"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cta/30 to-purple-600/20 animate-pulse-glow" />
              <div className="absolute inset-1 rounded-full bg-white/40 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/animations/solar-system.gif"
                  alt="태양계 애니메이션"
                  className="w-[78%] h-[78%] object-contain"
                />
              </div>
              <div className="absolute inset-[-6px] border border-cta/30 rounded-full animate-orbit" style={{ animationDuration: '30s' }} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-text-primary mb-2 tracking-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            이천점
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base font-medium text-text-secondary mb-6"
          >
            우주의 기운을 당신께 드려요
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link href="/saju">
              <Button variant="primary" size="lg">
                내 사주 보기
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 핵심 서비스 - 2x2 큰 카드 */}
      <section className="px-4 -mt-3 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3"
        >
          {MAIN_SERVICES.map((svc) => (
            <motion.div key={svc.id} variants={fadeUp}>
              <Link href={svc.href}>
                <div className={`
                  relative rounded-2xl p-4 h-[120px]
                  bg-gradient-to-br ${svc.gradient} bg-white/40
                  border border-[var(--border-default)]
                  hover:border-cta/50 transition-all
                  flex flex-col items-center justify-center text-center gap-1.5
                  active:scale-[0.97]
                `}>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">{svc.title}</h3>
                  <p className="text-xs font-medium text-text-secondary">{svc.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 추가 서비스 - 가로 스크롤 또는 작은 칩 */}
      <section className="px-4 mt-5">
        <h2 className="text-base font-bold text-text-primary mb-3 px-1">더 많은 운세</h2>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-5 gap-2"
        >
          {SUB_SERVICES.map((svc) => (
            <motion.div key={svc.id} variants={fadeUp}>
              <Link href={svc.href}>
                <div className="flex items-center justify-center h-[56px] p-2 rounded-xl bg-white/55 border border-[var(--border-default)] hover:border-cta/50 transition-all active:scale-[0.95]">
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
