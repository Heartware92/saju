'use client';

/**
 * 대표 프로필 기반 상세 만세력 페이지
 * - 홈의 간단 만세력에서 "만세력 보기" 버튼으로 진입
 * - 4기둥(시·일·월·년) × 행(십신/천간/지지/지장간/12운성/신살/합충/대운/세운)
 * - 모든 데이터는 대표 프로필의 birth_date/birth_time/gender 로 client-side 계산
 *   (DB 에는 원국(原局) 원자료만 저장, 계산 결과는 저장하지 않음)
 */

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import {
  calculateSaju,
  TEN_GODS_MAP,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  type Pillar,
} from '../utils/sajuCalculator';
import { getCorrectedTimeForSaju, resolveBirthLongitude } from '../utils/timeCorrection';
import {
  stemToHanja,
  zhiToHanja,
  ELEMENT_CELL_COLORS,
  type Element,
} from '../lib/character';

const PILLAR_LABELS = [
  { key: 'hour' as const,  label: '시주' },
  { key: 'day' as const,   label: '일주' },
  { key: 'month' as const, label: '월주' },
  { key: 'year' as const,  label: '년주' },
];

function ElementCell({
  element,
  text,
  size = 'lg',
}: {
  element: Element | '';
  text: string;
  size?: 'lg' | 'md' | 'sm';
}) {
  const colors = element
    ? ELEMENT_CELL_COLORS[element]
    : { bg: 'rgba(255,255,255,0.06)', fg: 'var(--text-secondary)' };
  const textSize =
    size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <div
      className={`rounded-md flex items-center justify-center font-bold ${textSize}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.fg,
        fontFamily: 'var(--font-serif)',
        minHeight: size === 'lg' ? 56 : size === 'md' ? 40 : 32,
      }}
    >
      {text}
    </div>
  );
}

function tenGodFor(dayGan: string, targetGan: string): string {
  if (!dayGan || !targetGan) return '';
  return TEN_GODS_MAP[dayGan]?.[targetGan] ?? '';
}

export default function ManseryeokPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? null,
    [profiles],
  );

  const saju = useMemo(() => {
    if (!primary) return null;
    const [y, m, d] = primary.birth_date.split('-').map(Number);
    const unknownTime = !primary.birth_time;
    const [h, min] = unknownTime
      ? [12, 0]
      : (primary.birth_time as string).split(':').map(Number);
    try {
      const longitude = resolveBirthLongitude(
        primary.birth_place,
        (primary as { longitude?: number | null }).longitude ?? null,
      );
      const corrected = getCorrectedTimeForSaju(y, m, d, h, min, longitude);
      const d2 = corrected.trueSolarTime.trueSolarTime;
      return calculateSaju(
        d2.getFullYear(),
        d2.getMonth() + 1,
        d2.getDate(),
        unknownTime ? 12 : d2.getHours(),
        unknownTime ? 0 : d2.getMinutes(),
        primary.gender,
        unknownTime,
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [primary]);

  if (!primary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">대표 프로필이 없어요</p>
        <Link
          href="/saju/input"
          className="px-5 py-2.5 rounded-xl bg-cta text-white text-sm font-semibold"
        >
          프로필 등록
        </Link>
      </div>
    );
  }

  if (!saju) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dayGan = saju.dayMaster;
  const ordered: { label: string; pillar: Pillar; unknown: boolean }[] =
    PILLAR_LABELS.map((p) => ({
      label: p.label,
      pillar: saju.pillars[p.key],
      unknown: p.key === 'hour' && saju.hourUnknown,
    }));

  const thisYear = new Date().getFullYear();
  const age = thisYear - parseInt(primary.birth_date.slice(0, 4), 10) + 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen px-4 pt-4 pb-10"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
          aria-label="뒤로"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center flex-1">
          <h1
            className="text-base font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            만세력
          </h1>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            {primary.name} · 만 {age - 1}세
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* 생년월일 요약 */}
      <div className="rounded-xl p-3 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] text-center text-[12px] text-text-secondary">
        {primary.birth_date}
        {primary.birth_time ? ` ${primary.birth_time}` : ' (시간 모름)'}
        {' · '}
        {primary.gender === 'male' ? '남' : '여'}
        {' · '}
        음력 {saju.lunarDateSimple}
      </div>

      {/* 4기둥 카드 */}
      <section className="grid grid-cols-4 gap-2 mb-4">
        {ordered.map((c) => (
          <div
            key={c.label}
            className="rounded-xl p-2.5 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] flex flex-col items-center gap-2"
          >
            {/* 기둥 라벨 */}
            <div className="text-[11px] font-medium text-text-tertiary">
              {c.label}
            </div>

            {/* 천간 십신 */}
            <div className="text-[11px] text-text-secondary min-h-[15px]">
              {c.unknown ? '—' : c.pillar.tenGodGan || '일간'}
            </div>

            {/* 천간 */}
            <ElementCell
              element={c.unknown ? '' : (c.pillar.ganElement as Element)}
              text={c.unknown ? '?' : stemToHanja(c.pillar.gan)}
              size="lg"
            />

            {/* 지지 */}
            <ElementCell
              element={c.unknown ? '' : (c.pillar.zhiElement as Element)}
              text={c.unknown ? '?' : zhiToHanja(c.pillar.zhi)}
              size="lg"
            />

            {/* 지지 십신 */}
            <div className="text-[11px] text-text-secondary min-h-[15px]">
              {c.unknown ? '—' : c.pillar.tenGodZhi}
            </div>

            {/* 12운성 */}
            <div className="text-[10px] text-text-tertiary border-t border-[var(--border-subtle)] w-full text-center pt-1.5">
              {c.unknown ? '—' : c.pillar.twelveStage}
            </div>

            {/* 지장간 */}
            <div className="flex flex-col items-center gap-0.5 w-full">
              {c.unknown || c.pillar.hiddenStems.length === 0 ? (
                <span className="text-[11px] text-text-tertiary">—</span>
              ) : (
                c.pillar.hiddenStems.map((hs, i) => {
                  const el = STEM_ELEMENT[hs] as Element;
                  return (
                    <div key={i} className="w-full flex items-center justify-between px-1 leading-tight">
                      <span
                        className="text-[13px] font-bold"
                        style={{ fontFamily: 'var(--font-serif)', color: ELEMENT_CELL_COLORS[el]?.bg }}
                      >
                        {stemToHanja(hs)}
                      </span>
                      <span className="text-[9px] text-text-tertiary">{tenGodFor(dayGan, hs)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </section>

      {/* 오행 개수 */}
      <section className="rounded-2xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">오행 분포</span>
          <span className="text-[11px] text-text-secondary">
            {saju.isStrong ? '신강' : '신약'} · 용신 {saju.yongSinElement}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {(['목','화','토','금','수'] as Element[]).map((el) => (
            <div key={el} className="flex flex-col items-center">
              <ElementCell element={el} text={el === '목' ? '木' : el === '화' ? '火' : el === '토' ? '土' : el === '금' ? '金' : '水'} size="md" />
              <span className="text-[11px] text-text-secondary mt-1">{saju.elementCount[el]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 합충형파해 */}
      {saju.interactions.length > 0 && (
        <section className="rounded-2xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
          <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 px-1">
            합·충·형
          </div>
          <div className="flex flex-wrap gap-1.5">
            {saju.interactions.map((it, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-1 rounded-md bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-text-secondary"
              >
                {it.description}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 신살 */}
      {saju.sinSals.length > 0 && (
        <section className="rounded-2xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
          <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 px-1">
            신살
          </div>
          <div className="flex flex-wrap gap-1.5">
            {saju.sinSals.map((ss, i) => {
              const color =
                ss.type === 'good' ? '#34D399' : ss.type === 'bad' ? '#F87171' : '#FBBF24';
              return (
                <span
                  key={i}
                  className="text-[11px] px-2 py-1 rounded-md border"
                  style={{
                    color,
                    borderColor: `${color}55`,
                    backgroundColor: `${color}15`,
                  }}
                  title={ss.description}
                >
                  {ss.name}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* 대운 */}
      <section className="rounded-2xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">대운 (10년 단위)</span>
          <span className="text-[11px] text-text-secondary">시작 {saju.daeWoonStartAge}세</span>
        </div>
        <div className="overflow-x-auto -mx-3 px-3">
          <div className="flex gap-1.5 min-w-max">
            {saju.daeWoon.slice(0, 10).map((dw, i) => {
              const ganEl = STEM_ELEMENT[dw.gan] as Element;
              const zhiEl = BRANCH_ELEMENT[dw.zhi] as Element;
              const isCurrent = age >= dw.startAge && age <= dw.endAge;
              return (
                <div
                  key={i}
                  className={`w-[58px] flex flex-col items-center gap-1 p-1.5 rounded-lg border ${
                    isCurrent ? 'border-cta/60 bg-cta/5' : 'border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-[10px] text-text-tertiary">{dw.startAge}세</span>
                  <span className="text-[9px] text-text-tertiary">{dw.tenGod}</span>
                  <ElementCell element={ganEl} text={stemToHanja(dw.gan)} size="sm" />
                  <ElementCell element={zhiEl} text={zhiToHanja(dw.zhi)} size="sm" />
                  <span className="text-[9px] text-text-tertiary">{dw.twelveStage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 세운 */}
      <section className="rounded-2xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] mb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">세운 (10년)</span>
          <span className="text-[11px] text-text-secondary">올해 {saju.currentSeWoon.gan}{saju.currentSeWoon.zhi}</span>
        </div>
        <div className="overflow-x-auto -mx-3 px-3">
          <div className="flex gap-1.5 min-w-max">
            {saju.seWoon.map((sw) => {
              const ganEl = STEM_ELEMENT[sw.gan] as Element;
              const zhiEl = BRANCH_ELEMENT[sw.zhi] as Element;
              const isCurrent = sw.year === thisYear;
              return (
                <div
                  key={sw.year}
                  className={`w-[56px] flex flex-col items-center gap-1 p-1.5 rounded-lg border ${
                    isCurrent ? 'border-cta/60 bg-cta/5' : 'border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-[10px] text-text-tertiary">{sw.year}</span>
                  <span className="text-[9px] text-text-tertiary">{sw.tenGod}</span>
                  <ElementCell element={ganEl} text={stemToHanja(sw.gan)} size="sm" />
                  <ElementCell element={zhiEl} text={zhiToHanja(sw.zhi)} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 하단 안내 */}
      <p className="text-[11px] text-text-tertiary text-center mt-4">
        이 만세력은 대표 프로필을 기준으로 자동 계산됩니다.
        <br />
        다른 가족/지인의 만세력을 보려면 프로필을 변경하세요.
      </p>
    </motion.div>
  );
}
