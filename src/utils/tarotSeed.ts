/**
 * 타로 deterministic 카드 뽑기
 * - 같은 날짜(월)에 들어오면 같은 카드가 나오도록 시드 기반 선택
 * - 로그인 사용자라면 uid를 섞어 개인별 고정, 비로그인은 날짜만으로 고정
 */

/**
 * 문자열 → 32bit 정수 해시 (xmur3 변종)
 */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/**
 * mulberry32 PRNG — seed 고정 시 시퀀스 재현 가능
 */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DrawResult {
  cardIndex: number;     // 0..deckSize-1
  isReversed: boolean;   // 역방향 여부
}

/**
 * 단일 카드 뽑기
 * @param seedKey 예: `today:2026-04-14` 또는 `today:2026-04-14:uid-xxx`
 * @param deckSize 카드 개수 (메이저 아르카나 22)
 * @param reverseProbability 역방향 확률 (기본 0.35)
 */
export function drawOne(
  seedKey: string,
  deckSize: number = 22,
  reverseProbability: number = 0.35
): DrawResult {
  const seed = hashString(seedKey);
  const rng = mulberry32(seed);
  const cardIndex = Math.floor(rng() * deckSize);
  const isReversed = rng() < reverseProbability;
  return { cardIndex, isReversed };
}

/**
 * 중복 없이 N장 뽑기 (Fisher-Yates with seeded RNG)
 */
export function drawMany(
  seedKey: string,
  n: number,
  deckSize: number = 22,
  reverseProbability: number = 0.35
): DrawResult[] {
  if (n > deckSize) {
    throw new Error(`drawMany: n(${n}) > deckSize(${deckSize})`);
  }
  const seed = hashString(seedKey);
  const rng = mulberry32(seed);

  const pool = Array.from({ length: deckSize }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, n);
  return picked.map((cardIndex) => ({
    cardIndex,
    isReversed: rng() < reverseProbability,
  }));
}

/**
 * 오늘 날짜 키 (YYYY-MM-DD, 로컬 타임존 기준)
 */
export function getTodayKey(uid?: string | null): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const base = `today:${y}-${m}-${d}`;
  return uid ? `${base}:${uid}` : base;
}

/**
 * 이번 달 키 (YYYY-MM)
 */
export function getMonthKey(uid?: string | null): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const base = `month:${y}-${m}`;
  return uid ? `${base}:${uid}` : base;
}

/**
 * 사람이 읽는 오늘 날짜 (프롬프트·표시용)
 */
export function formatTodayString(): string {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * 사람이 읽는 이번 달 (예: "2026년 4월")
 */
export function formatMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
}
