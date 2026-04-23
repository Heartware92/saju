/**
 * 회원 관리 탭 — 검색 / 성별 / 연령대 / 초기화 필터 바.
 * 정렬은 테이블 헤더에서 직접 토글하므로 여기엔 없음.
 * 세그먼트 필터는 DemographicsSummary 쪽 칩으로 분리되어 있음.
 */
'use client';

import { AGE_BUCKETS, type AgeBucketKey } from '@/constants/adminLabels';

interface Props {
  search: string; onSearchChange: (s: string) => void;
  gender: 'male' | 'female' | 'unknown' | '';
  onGenderChange: (g: 'male' | 'female' | 'unknown' | '') => void;
  ageBucket: AgeBucketKey | '';
  onAgeBucketChange: (a: AgeBucketKey | '') => void;
  totalCount: number;
}

export function MembersFilterBar({
  search, onSearchChange,
  gender, onGenderChange,
  ageBucket, onAgeBucketChange,
  totalCount,
}: Props) {
  const hasFilter = !!search || !!gender || !!ageBucket;

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <input
        type="text"
        placeholder="이메일 검색"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="flex-1 min-w-[200px] max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cta/50"
      />

      <select
        value={gender}
        onChange={e => onGenderChange(e.target.value as any)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-[14px] text-text-primary focus:outline-none focus:border-cta/50"
      >
        <option value="">전체 성별</option>
        <option value="male">남성</option>
        <option value="female">여성</option>
        <option value="unknown">미등록</option>
      </select>

      <select
        value={ageBucket}
        onChange={e => onAgeBucketChange(e.target.value as any)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-[14px] text-text-primary focus:outline-none focus:border-cta/50"
      >
        <option value="">전체 연령</option>
        {AGE_BUCKETS.map(b => (
          <option key={b.key} value={b.key}>{b.label}</option>
        ))}
      </select>

      {hasFilter && (
        <button
          onClick={() => { onSearchChange(''); onGenderChange(''); onAgeBucketChange(''); }}
          className="px-3 py-2 rounded-lg text-[13px] text-text-tertiary hover:text-text-secondary border border-white/10 hover:border-white/20 transition-colors"
        >
          필터 초기화
        </button>
      )}

      <span className="ml-auto text-[13px] text-text-tertiary whitespace-nowrap">
        조회 결과 <span className="text-text-primary font-medium">{totalCount.toLocaleString()}</span>명
      </span>
    </div>
  );
}
