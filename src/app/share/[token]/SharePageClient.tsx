'use client';

import { motion } from 'framer-motion';
import { SAJU_CATEGORY_LABEL } from '@/constants/adminLabels';
import {
  JUNGTONGSAJU_SECTION_KEYS, JUNGTONGSAJU_SECTION_LABELS,
  NEWYEAR_SECTION_KEYS, NEWYEAR_SECTION_LABELS,
  TODAY_SECTION_KEYS, TODAY_SECTION_LABELS,
  PICKED_DATE_SECTION_KEYS, PICKED_DATE_SECTION_LABELS,
  ZAMIDUSU_SECTION_KEYS, ZAMIDUSU_SECTION_LABELS,
} from '@/constants/prompts';
import {
  parseJungtongsaju, parseNewyearReport, parseTodayFortune,
  parsePickedDateReport, parseZamidusuSections,
} from '@/services/fortuneService';

interface Props {
  type: 'saju' | 'tarot';
  record: Record<string, any>;
}

type SectionConfig = {
  keys: readonly string[];
  labels: Record<string, string>;
  parser: (raw: string) => Partial<Record<string, string>>;
};

const SECTION_MAP: Record<string, SectionConfig> = {
  traditional: { keys: JUNGTONGSAJU_SECTION_KEYS, labels: JUNGTONGSAJU_SECTION_LABELS, parser: parseJungtongsaju },
  newyear:     { keys: NEWYEAR_SECTION_KEYS,      labels: NEWYEAR_SECTION_LABELS,      parser: parseNewyearReport },
  today:       { keys: TODAY_SECTION_KEYS,         labels: TODAY_SECTION_LABELS,         parser: parseTodayFortune },
  date:        { keys: PICKED_DATE_SECTION_KEYS,   labels: PICKED_DATE_SECTION_LABELS,  parser: parsePickedDateReport },
  zamidusu:    { keys: ZAMIDUSU_SECTION_KEYS,      labels: ZAMIDUSU_SECTION_LABELS,      parser: parseZamidusuSections },
};

function genericParser(raw: string): Partial<Record<string, string>> {
  return { _full: raw };
}

export default function SharePageClient({ type, record }: Props) {
  const category: string = type === 'saju' ? record.category : 'tarot';
  const label = type === 'saju'
    ? SAJU_CATEGORY_LABEL[category] ?? '사주 풀이'
    : '타로 리딩';

  const content = record.interpretation_detailed || record.interpretation_basic || record.interpretation || '';

  const config = SECTION_MAP[category];
  const sections = config ? config.parser(content) : genericParser(content);
  const sectionKeys = config ? config.keys : ['_full'];
  const sectionLabels = config ? config.labels : { _full: label };

  const profileName = record.profile_name;
  const birthDate = record.birth_date;
  const createdAt = record.created_at;

  return (
    <div className="min-h-screen px-4 pt-4 pb-12 max-w-lg mx-auto">
      {/* 브랜드 헤더 */}
      <div className="text-center mb-6">
        <a href="/" className="inline-block">
          <h1
            className="text-lg font-bold bg-gradient-to-r from-sun-core via-cta to-moon-halo bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            이천점
          </h1>
        </a>
      </div>

      {/* 카테고리 + 프로필 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl px-5 py-4 mb-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
      >
        <div
          className="text-[18px] font-bold text-text-primary mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {label}
        </div>
        <div className="text-[13px] text-text-tertiary space-x-2">
          {profileName && <span>{profileName}</span>}
          {birthDate && <span>{birthDate.replace(/-/g, '.')}</span>}
          {record.partner_name && (
            <span>
              {'& '}{record.partner_name}
              {record.partner_birth_date && ` (${record.partner_birth_date.replace(/-/g, '.')})`}
            </span>
          )}
        </div>
        {createdAt && (
          <div className="text-[12px] text-text-tertiary mt-1">
            {new Date(createdAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        )}
      </motion.div>

      {/* 타로 질문 */}
      {type === 'tarot' && record.question && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl px-5 py-4 mb-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
        >
          <div className="text-[13px] text-text-tertiary mb-1">질문</div>
          <div className="text-[15px] text-text-secondary">{record.question}</div>
        </motion.div>
      )}

      {/* 섹션 카드 */}
      <div className="space-y-2">
        {sectionKeys.map((key, idx) => {
          const text = sections[key as string];
          if (!text) return null;

          const sLabel = (sectionLabels as Record<string, string>)[key as string] ?? '';

          const lines = text.trim().split('\n');
          const firstLine = lines[0]?.trim() ?? '';
          const hasMetaphor =
            lines.length > 1 &&
            firstLine.length > 0 &&
            firstLine.length <= 60 &&
            !firstLine.startsWith('-') &&
            !firstLine.endsWith('.');
          const metaphorTitle = hasMetaphor ? firstLine : '';
          const bodyText = hasMetaphor ? lines.slice(1).join('\n').trim() : text;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * idx }}
              className="rounded-2xl p-5 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
            >
              {sLabel && key !== '_full' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-1 h-5 rounded-full bg-cta" />
                  <div
                    className="text-[17px] font-bold text-text-primary tracking-tight"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {sLabel}
                  </div>
                </div>
              )}

              {metaphorTitle && (
                <div
                  className="text-[15px] font-medium leading-snug text-cta/90 mb-4 pl-3"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {metaphorTitle}
                </div>
              )}

              <p className="text-[15px] text-text-secondary leading-[1.85] whitespace-pre-line tracking-[-0.005em]">
                {bodyText}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* CTA 배너 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] shadow-lg shadow-cta/20"
        >
          나도 운세 보러 가기
        </a>
        <p className="text-[12px] text-text-tertiary mt-2">
          이천점 — 별빛이 읽어주는 사주
        </p>
      </motion.div>
    </div>
  );
}
