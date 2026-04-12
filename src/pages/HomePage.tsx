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
    icon: '📜',
    desc: '사주팔자 종합 분석',
    href: '/saju',
    gradient: 'from-purple-500/20 to-indigo-500/10',
    iconBg: 'bg-purple-500/15',
  },
  {
    id: 'today',
    title: '오늘의 운세',
    icon: '☀️',
    desc: '오늘 하루 운세',
    href: '/saju/input?category=today',
    gradient: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-500/15',
  },
  {
    id: 'tojeong',
    title: '토정비결',
    icon: '📖',
    desc: '한 해 길흉화복',
    href: '/saju/input?category=tojeong',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    iconBg: 'bg-emerald-500/15',
  },
  {
    id: 'date-fortune',
    title: '지정일 운세',
    icon: '📅',
    desc: '특정 날짜의 운세',
    href: '/saju/input?category=date',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconBg: 'bg-blue-500/15',
  },
];

const SUB_SERVICES = [
  {
    id: 'zamidusu',
    title: '자미두수',
    icon: '🌌',
    href: '/saju/input?category=zamidusu',
    credit: 'sun' as const,
    cost: 3,
  },
  {
    id: 'love',
    title: '애정운',
    icon: '💕',
    href: '/saju/input?category=love',
    credit: 'sun' as const,
    cost: 2,
  },
  {
    id: 'wealth',
    title: '재물운',
    icon: '💰',
    href: '/saju/input?category=wealth',
    credit: 'sun' as const,
    cost: 2,
  },
  {
    id: 'tarot',
    title: '타로',
    icon: '🃏',
    href: '/tarot',
    credit: 'moon' as const,
    cost: 1,
  },
  {
    id: 'newyear',
    title: '신년운세',
    icon: '🐍',
    href: '/saju/input?category=newyear',
    credit: 'moon' as const,
    cost: 1,
  },
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
    <div className="min-h-screen bg-space-deep">
      {/* Hero - 간결하게 */}
      <section className="relative starfield nebula-glow overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-14 pb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-5"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cta/30 to-purple-600/20 animate-pulse-glow" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cta/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl opacity-80">☯</span>
              </div>
              <div className="absolute inset-[-6px] border border-cta/20 rounded-full animate-orbit" style={{ animationDuration: '30s' }} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-bold text-text-primary mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            이천점
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-sm text-text-secondary mb-6"
          >
            2,000원으로 만나는 운명 상담
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
                  bg-gradient-to-br ${svc.gradient}
                  border border-[var(--border-subtle)]
                  hover:border-cta/30 transition-all
                  flex flex-col items-center justify-center text-center
                  active:scale-[0.97]
                `}>
                  <div className={`w-10 h-10 rounded-xl ${svc.iconBg} flex items-center justify-center text-xl mb-2`}>
                    {svc.icon}
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{svc.title}</h3>
                  <p className="text-[11px] text-text-tertiary">{svc.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 추가 서비스 - 가로 스크롤 또는 작은 칩 */}
      <section className="px-4 mt-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">더 많은 운세</h2>
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
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-space-surface/50 border border-[var(--border-subtle)] hover:border-cta/30 transition-all active:scale-[0.95]">
                  <span className="text-2xl">{svc.icon}</span>
                  <span className="text-[11px] font-medium text-text-secondary">{svc.title}</span>
                  <span className="text-[9px] text-text-tertiary">
                    {svc.credit === 'sun' ? `☀️${svc.cost}` : `🌙${svc.cost}`}
                  </span>
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
              <div className="relative px-5 py-5 bg-gradient-to-br from-[rgba(124,92,252,0.15)] to-[rgba(59,130,246,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[rgba(124,92,252,0.2)] flex items-center justify-center text-2xl shrink-0">
                    ✦
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-text-primary mb-0.5">타로 상담실</h3>
                    <p className="text-xs text-text-secondary">카드가 전하는 신비로운 메시지</p>
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
          <p className="text-xs text-text-tertiary mb-3">아직 사주를 모르시나요?</p>
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
