/**
 * AI 리포트 캐시 스토어
 *
 * 풀이 페이지에서 한 번 호출한 AI 리포트를 영속 캐시에 보관해, 탭 복귀·새로고침·뒤로가기로
 * 컴포넌트가 다시 마운트되더라도 같은 입력(사주+날짜 등)이면 재호출 없이 캐시를 돌려주고
 * 크레딧도 한 번만 차감되도록 한다.
 *
 * 키 형태: `${kind}::${specificKey}` — kind 별 네임스페이스로 분리.
 *
 * Why localStorage 영속화: useRef 가드만으로는 페이지 이탈→재진입에서 ref가 초기화되어
 * 같은 날짜 같은 사주에 대해 또 차감되는 사례가 보고됨. 영속 캐시로 진실의 원천을 둔다.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SajuResult } from '../utils/sajuCalculator';

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const MAX_ENTRIES = 100; // LRU 상한 — localStorage 5MB 한도 보호

export type ReportKind =
  | 'today'         // 오늘의 운세 / 지정일 운세 (TodayFortunePage)
  | 'jungtong'      // 정통사주 (SajuResultPage)
  | 'zamidusu'      // 자미두수 (ZamidusuResultPage)
  | 'tojeong'       // 토정비결 (TojeongResultPage)
  | 'newyear'       // 신년운세 (PeriodFortunePage scope=year)
  | 'period_day'    // 오늘의 운세 (PeriodFortunePage scope=day)
  | 'period_date'   // 지정일 운세 (PeriodFortunePage scope=date)
  | 'taekil'        // 택일 (TaekilPage)
  | 'gunghap'       // 궁합 (GunghapPage)
  | 'tarot'         // 타로 (TarotPage)
  | `more:${string}`; // 더 많은 운세 카테고리 (love/wealth/career/...)

interface CacheEntry {
  data: unknown;
  charged: boolean;
  createdAt: number;
}

interface ReportCacheState {
  entries: Record<string, CacheEntry>;

  /** 캐시 조회 — 만료 시 null. */
  getReport: <T = unknown>(kind: ReportKind, key: string) => { data: T; charged: boolean } | null;
  /** 캐시 저장 — 기존 charged 플래그는 보존. */
  setReport: (kind: ReportKind, key: string, data: unknown) => void;
  /** 차감 완료 표시. 두 번 호출돼도 한 번만 차감되도록 호출자가 isCharged로 가드. */
  markCharged: (kind: ReportKind, key: string) => void;
  /** 이미 차감됐는지 — true면 chargeForContent 호출 금지. */
  isCharged: (kind: ReportKind, key: string) => boolean;
  /** 특정 항목 또는 kind 전체 무효화 (수동 새로고침 버튼용). */
  invalidate: (kind: ReportKind, key?: string) => void;
  /** 전체 캐시 초기화 (로그아웃 등). */
  clearAll: () => void;
}

const compose = (kind: string, key: string) => `${kind}::${key}`;

export const useReportCacheStore = create<ReportCacheState>()(
  persist(
    (set, get) => ({
      entries: {},

      getReport: (kind, key) => {
        const e = get().entries[compose(kind, key)];
        if (!e) return null;
        if (Date.now() - e.createdAt > TTL_MS) return null;
        return { data: e.data as never, charged: e.charged };
      },

      setReport: (kind, key, data) => {
        set(state => {
          const composed = compose(kind, key);
          const existing = state.entries[composed];
          const next: Record<string, CacheEntry> = {
            ...state.entries,
            [composed]: {
              data,
              charged: existing?.charged ?? false,
              createdAt: Date.now(),
            },
          };
          // LRU 정리: 항목 수가 상한 넘으면 오래된 것부터 제거
          const keys = Object.keys(next);
          if (keys.length > MAX_ENTRIES) {
            const sorted = keys.sort((a, b) => next[a].createdAt - next[b].createdAt);
            for (const k of sorted.slice(0, keys.length - MAX_ENTRIES)) {
              delete next[k];
            }
          }
          return { entries: next };
        });
      },

      markCharged: (kind, key) => {
        set(state => {
          const composed = compose(kind, key);
          const e = state.entries[composed];
          if (!e) return state;
          return { entries: { ...state.entries, [composed]: { ...e, charged: true } } };
        });
      },

      isCharged: (kind, key) => !!get().entries[compose(kind, key)]?.charged,

      invalidate: (kind, key) => {
        set(state => {
          const next = { ...state.entries };
          if (!key) {
            for (const k of Object.keys(next)) {
              if (k.startsWith(`${kind}::`)) delete next[k];
            }
          } else {
            delete next[compose(kind, key)];
          }
          return { entries: next };
        });
      },

      clearAll: () => set({ entries: {} }),
    }),
    {
      name: 'report-cache',
      version: 1,
    },
  ),
);

// ── 키 헬퍼 ──────────────────────────────────────────────────

/** 사주 원국을 식별하는 안정 문자열 — 같은 사주는 같은 키로 모인다. */
export const sajuKey = (s: SajuResult): string => {
  const p = s.pillars;
  const hour = s.hourUnknown ? 'X' : `${p.hour.gan}${p.hour.zhi}`;
  return `${p.year.gan}${p.year.zhi}_${p.month.gan}${p.month.zhi}_${p.day.gan}${p.day.zhi}_${hour}_${s.gender ?? '?'}`;
};
