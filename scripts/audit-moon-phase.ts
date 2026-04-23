/**
 * 향후 10년(2026-01-01 ~ 2036-12-31) 달 위상 계산 검증.
 *
 * 목적
 *  1) lunar-javascript 가 향후 10년간 이상값(0, 31, NaN, non-integer) 을 반환하는가?
 *  2) SVG 기하식(cos, rx, sweep flag)에서 NaN·Infinity 생기는가?
 *  3) 현재 fallback(삭→보름) 규칙이 몇 번 발동하는가?
 *  4) 한국에서 관측 가능한 일식·월식 날짜에 대해 렌더가 정상인가?
 *  5) 놓친 엣지 케이스 후보 탐색 (예: 같은 음력일이 연속되는 날, 윤달 경계)
 *
 * 실행: npx tsx scripts/audit-moon-phase.ts
 */

import { Solar } from 'lunar-javascript';

const START = new Date(2026, 0, 1);  // 2026-01-01
const END   = new Date(2036, 11, 31);

function ymd(d: Date): [number, number, number] {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}

interface DailyResult {
  date: string;
  lunarDay: number;
  phase: number;
  cos: number;
  rx: number;
  waxing: boolean;
  isInvisible: boolean;
  nanFlag: boolean;
}

const daily: DailyResult[] = [];
const anomalies: string[] = [];

let cursor = new Date(START);
while (cursor <= END) {
  const [y, m, d] = ymd(cursor);
  let lunarDay: number;
  try {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    lunarDay = lunar.getDay();
  } catch (e: any) {
    anomalies.push(`[ERROR] ${y}-${m}-${d}: ${e.message}`);
    cursor.setDate(cursor.getDate() + 1);
    continue;
  }

  // 이상값 검사 (음력일은 1~30 이어야)
  if (typeof lunarDay !== 'number' || isNaN(lunarDay)) {
    anomalies.push(`[NaN] ${y}-${m}-${d}: getDay()=${lunarDay}`);
  } else if (!Number.isInteger(lunarDay)) {
    anomalies.push(`[NonInt] ${y}-${m}-${d}: getDay()=${lunarDay}`);
  } else if (lunarDay < 1 || lunarDay > 30) {
    anomalies.push(`[OutOfRange] ${y}-${m}-${d}: getDay()=${lunarDay}`);
  }

  // 현재 컴포넌트 로직 재현
  const safeLunarDay = typeof lunarDay === 'number' && !isNaN(lunarDay) ? lunarDay : 15;
  const isInvisible = safeLunarDay <= 1 || safeLunarDay >= 30;
  const renderDay = isInvisible ? 15 : safeLunarDay;
  const phase = (renderDay - 1) / 29.53;
  const cos = Math.cos(2 * Math.PI * phase);
  const rx = Math.abs(cos) * 40;
  const waxing = phase < 0.5;

  const nanFlag = isNaN(phase) || isNaN(cos) || isNaN(rx) || !isFinite(phase);
  if (nanFlag) {
    anomalies.push(`[RenderNaN] ${y}-${m}-${d}: phase=${phase} cos=${cos} rx=${rx}`);
  }

  daily.push({
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    lunarDay: safeLunarDay,
    phase,
    cos,
    rx,
    waxing,
    isInvisible,
    nanFlag,
  });

  cursor.setDate(cursor.getDate() + 1);
}

// ── 통계 ────────────────────────────────────────
const total = daily.length;
const invisibleDays = daily.filter(r => r.isInvisible).length;
const lunarDayHistogram: Record<number, number> = {};
daily.forEach(r => { lunarDayHistogram[r.lunarDay] = (lunarDayHistogram[r.lunarDay] || 0) + 1; });

// 연속된 같은 음력일 개수 (정상적으로는 하루 차이로 증가해야 함)
const sameConsecutive: string[] = [];
for (let i = 1; i < daily.length; i++) {
  if (daily[i].lunarDay === daily[i - 1].lunarDay) {
    sameConsecutive.push(`${daily[i - 1].date}→${daily[i].date} lunarDay=${daily[i].lunarDay}`);
  }
}

// ── 한국에서 관측되는 주요 일식·월식 (KASI + NASA eclipse catalog, 2026–2036)
const notableEclipses: { date: string; type: string; note: string }[] = [
  { date: '2026-02-17', type: '금환일식', note: '남극 — 한국 미관측' },
  { date: '2026-03-03', type: '개기월식', note: '한국 일부 관측' },
  { date: '2026-08-12', type: '개기일식', note: '유럽·아이슬란드 — 한국 미관측' },
  { date: '2026-08-28', type: '부분월식', note: '' },
  { date: '2027-02-06', type: '금환일식', note: '남미 — 미관측' },
  { date: '2027-08-02', type: '개기일식', note: '북아프리카 — 미관측' },
  { date: '2028-01-26', type: '금환일식', note: '' },
  { date: '2028-07-22', type: '개기일식', note: '호주 — 미관측' },
  { date: '2028-12-31', type: '부분월식', note: '' },
  { date: '2029-06-12', type: '부분일식', note: '' },
  { date: '2029-06-26', type: '개기월식', note: '한국 관측 가능' },
  { date: '2029-12-20', type: '개기월식', note: '한국 관측 가능' },
  { date: '2030-06-01', type: '금환일식', note: '북극 — 한국 일부 부분일식' },
  { date: '2030-11-25', type: '개기일식', note: '남아프리카 — 미관측' },
  { date: '2032-04-25', type: '개기월식', note: '' },
  { date: '2033-03-30', type: '개기일식', note: '알래스카 — 미관측' },
  { date: '2034-03-20', type: '개기일식', note: '서아시아 — 미관측' },
  { date: '2035-09-02', type: '개기일식', note: '한국(서울 부분) 관측 가능 — 중요' },
  { date: '2036-02-11', type: '개기월식', note: '한국 관측 가능' },
];

const eclipseCheck = notableEclipses.map(e => {
  const d = daily.find(r => r.date === e.date);
  if (!d) return { ...e, lunarDay: null, rendering: 'N/A' };
  const expectedFallback = e.type.includes('일식');  // 일식은 삭이어야 함
  const actualFallback = d.isInvisible;
  const ok = expectedFallback ? actualFallback : !actualFallback;
  return {
    ...e,
    lunarDay: d.lunarDay,
    rendering: d.isInvisible ? '보름달 fallback' : '정상 위상',
    expectedMatch: ok ? '✓' : '✗',
  };
});

// ── 리포트 ──────────────────────────────────────
console.log('═'.repeat(80));
console.log(' 향후 10년 달 위상 계산 감사 (2026-01-01 ~ 2036-12-31)');
console.log('═'.repeat(80));
console.log(`총 ${total}일 검사`);
console.log(`삭 fallback 발동: ${invisibleDays}일 (${((invisibleDays/total)*100).toFixed(1)}% — 전체의 약 1/30)`);
console.log(`이상값/NaN/에러: ${anomalies.length}건`);

console.log('\n── 음력일 분포 (1~30 각각 몇 회 나오는지) ──');
for (let d = 1; d <= 30; d++) {
  const count = lunarDayHistogram[d] || 0;
  console.log(`  ${String(d).padStart(2)}일: ${count}회`);
}

if (anomalies.length > 0) {
  console.log('\n── 🚨 이상값 상세 ──');
  anomalies.slice(0, 30).forEach(a => console.log('  ' + a));
  if (anomalies.length > 30) console.log(`  ... 외 ${anomalies.length - 30}건`);
} else {
  console.log('\n✓ 향후 10년간 lunar-javascript 반환값 이상 없음');
}

if (sameConsecutive.length > 0) {
  console.log(`\n── 같은 음력일 연속 발생: ${sameConsecutive.length}건 (윤달 경계 의심) ──`);
  sameConsecutive.slice(0, 10).forEach(s => console.log('  ' + s));
}

console.log('\n── 한국 관련 주요 일식·월식 검증 ──');
console.log('   날짜           | 타입      | 음력일 | 렌더      | Fallback정합 | 비고');
console.log('  ' + '─'.repeat(98));
eclipseCheck.forEach(e => {
  console.log(
    `   ${e.date.padEnd(13)} | ${e.type.padEnd(8)} | ${String(e.lunarDay ?? '-').padStart(5)}일 | ${String(e.rendering).padEnd(10)}| ${(e as any).expectedMatch ?? '?'}            | ${e.note}`
  );
});

// ── 최종 판정 ─────────────────────────────────
const failedEclipses = eclipseCheck.filter(e => (e as any).expectedMatch === '✗');
console.log('\n' + '═'.repeat(80));
if (anomalies.length === 0 && failedEclipses.length === 0) {
  console.log(' 🟢 향후 10년 검증 통과 — 추가 필터 불필요');
} else {
  console.log(` 🔴 이슈: 이상값 ${anomalies.length}건, 일식/월식 렌더 불일치 ${failedEclipses.length}건`);
}
console.log('═'.repeat(80));
