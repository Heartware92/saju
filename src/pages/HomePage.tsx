'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MoonIcon } from '../components/ui/CreditDisplay';

const SAJU_CATEGORIES = [
  { id: 'today', title: '오늘의 운세', icon: '☀️', desc: '하루의 기운 미리보기', credit: 'moon', cost: 1 },
  { id: 'traditional', title: '정통 사주', icon: '✦', desc: '타고난 운명의 별자리', credit: 'sun', cost: 1 },
  { id: 'love', title: '애정운', icon: '✧', desc: '쌍성이 비추는 인연', credit: 'sun', cost: 1 },
  { id: 'wealth', title: '재물운', icon: '☄', desc: '혜성이 이끄는 재물', credit: 'sun', cost: 1 },
  { id: 'newyear', title: '2026 신년운세', icon: '★', desc: '병오년 우주의 흐름', credit: 'moon', cost: 1 },
  { id: 'tojeong', title: '토정비결', icon: '☽', desc: '별자리에 새긴 비결', credit: 'moon', cost: 1 },
  { id: 'tomorrow', title: '내일의 운세', icon: '☾', desc: '초승달이 전하는 내일', credit: 'moon', cost: 1 },
  { id: 'date', title: '지정일 운세', icon: '◎', desc: '그 날의 궤도를 읽다', credit: 'moon', cost: 1 },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-space-deep">
      {/* Hero Section */}
      <section className="relative starfield nebula-glow overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 md:pt-32 md:pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="mb-6"
          >
            {/* Abstract cosmic symbol */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cta/30 to-purple-600/20 animate-pulse-glow" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cta/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl md:text-5xl opacity-80">☯</span>
              </div>
              {/* Orbit ring */}
              <div className="absolute inset-[-8px] border border-cta/20 rounded-full animate-orbit" style={{ animationDuration: '30s' }} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-3xl md:text-5xl font-bold text-text-primary mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            우주의 기운을 드립니다
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-base md:text-lg text-text-secondary max-w-md mb-8"
          >
            별이 새긴 당신의 운명을 읽어드립니다
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link href="/saju?category=traditional">
              <Button variant="primary" size="lg">
                내 사주 보기
              </Button>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 animate-float"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 10l5 5 5-5" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto -mt-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-lg font-semibold text-text-secondary mb-4 px-1"
        >
          운세 서비스
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {SAJU_CATEGORIES.map((cat) => (
            <motion.div key={cat.id} variants={fadeUp}>
              <Link href={`/saju?category=${cat.id}`}>
                <Card hover padding="md" className="h-full group">
                  <div className="flex flex-col gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[rgba(124,92,252,0.12)] flex items-center justify-center text-xl group-hover:bg-[rgba(124,92,252,0.2)] transition-colors">
                      {cat.icon}
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-0.5">{cat.title}</h3>
                      <p className="text-xs text-text-tertiary leading-relaxed">{cat.desc}</p>
                    </div>

                    {/* Credit cost */}
                    <div className="flex items-center gap-1 mt-auto">
                      {cat.credit === 'sun' ? (
                        <span className="text-[10px] text-sun-corona font-medium">☀ {cat.cost}</span>
                      ) : (
                        <span className="text-[10px] text-moon-halo font-medium">☾ {cat.cost}</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Tarot Banner */}
      <section className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto mt-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/tarot">
            <Card hover padding="none" glow="cta" className="overflow-hidden">
              <div className="relative px-6 py-8 md:py-10 bg-gradient-to-br from-[rgba(124,92,252,0.15)] to-[rgba(59,130,246,0.08)]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[rgba(124,92,252,0.2)] flex items-center justify-center text-3xl shrink-0">
                    ✦
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary mb-1">타로 상담실</h3>
                    <p className="text-sm text-text-secondary">별빛이 비추는 신비로운 카드의 메시지</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto mb-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-8"
        >
          <p className="text-sm text-text-tertiary mb-4">아직 사주를 모르시나요?</p>
          <Link href="/saju?category=traditional">
            <Button variant="outline" size="md">
              무료 사주 계산
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
