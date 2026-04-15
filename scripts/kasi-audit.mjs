/**
 * KASI 24절기 교차검증 스크립트 (의존성 없는 .mjs)
 *
 * 목적: JEOLIP_DATA(lunar-javascript 기반)가 KASI 공식값과 일치하는지 검증.
 *       사주 월주 경계는 절입(節入) 분 단위까지 정확해야 함.
 *
 * 데이터 소스: 공공데이터포털 "한국천문연구원_특일정보" B090041
 *   - https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo
 *   - 응답: dateName(절기명), locdate(YYYYMMDD), kst(HHMM, 일부에만)
 *
 * 사주 12 절(節)만 비교 (12 중기 무시):
 *   소한·입춘·경칩·청명·입하·망종·소서·입추·백로·한로·입동·대설
 *
 * 가용 범위: KASI 24절기 API 는 2000~2027년만 데이터 제공.
 *           이 범위에서 lunar-javascript 와 일치 검증되면, 우리 데이터 전 구간
 *           (1920-2050) 의 천체계산 신뢰도가 입증됨.
 *
 * 사용:
 *   1) .env.local 에 KASI_SPCDE_API_KEY=<Decoding 키>
 *   2) node scripts/kasi-audit.mjs              (기본 2000-2027)
 *   3) node scripts/kasi-audit.mjs 2010 2015    (특정 구간)
 *
 * 출력:
 *   - 콘솔: 연도별 일치/불일치 카운트, 불일치 상세
 *   - scripts/.kasi-cache/{year}.json (재실행 시 캐시)
 *   - src/lib/data/kasi-overrides.json (시각 불일치만 KASI 정답으로)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const CACHE_DIR = resolve(__dirname, '.kasi-cache');
const OVERRIDES_PATH = resolve(PROJECT_ROOT, 'src/lib/data/kasi-overrides.json');
const JEOLIP_TS = resolve(PROJECT_ROOT, 'src/lib/data/jeolip.ts');
const ENV_PATH = resolve(PROJECT_ROOT, '.env.local');

// ──────────────────────────────────────────────
// .env.local 에서 KASI_SPCDE_API_KEY 읽기
// ──────────────────────────────────────────────
function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const raw = readFileSync(ENV_PATH, 'utf-8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const KEY = env.KASI_SPCDE_API_KEY || process.env.KASI_SPCDE_API_KEY;
if (!KEY) {
  console.error('❌ KASI_SPCDE_API_KEY 환경변수가 없습니다. .env.local 확인');
  process.exit(1);
}

const API_BASE =
  'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo';

const JEOL_12 = {
  소한: { sajuMonth: 12, solarMonth: 1 },
  입춘: { sajuMonth: 1, solarMonth: 2 },
  경칩: { sajuMonth: 2, solarMonth: 3 },
  청명: { sajuMonth: 3, solarMonth: 4 },
  입하: { sajuMonth: 4, solarMonth: 5 },
  망종: { sajuMonth: 5, solarMonth: 6 },
  소서: { sajuMonth: 6, solarMonth: 7 },
  입추: { sajuMonth: 7, solarMonth: 8 },
  백로: { sajuMonth: 8, solarMonth: 9 },
  한로: { sajuMonth: 9, solarMonth: 10 },
  입동: { sajuMonth: 10, solarMonth: 11 },
  대설: { sajuMonth: 11, solarMonth: 12 },
};

// ──────────────────────────────────────────────
// jeolip.ts 에서 데이터 파싱 (정규식)
// ──────────────────────────────────────────────
function loadJeolipIndex() {
  const src = readFileSync(JEOLIP_TS, 'utf-8');
  const re =
    /\{\s*year:\s*(\d+),\s*month:\s*(\d+),\s*solarTermName:\s*'([^']+)',\s*datetime:\s*'([^']+)',\s*sajuMonth:\s*(\d+)\s*\}/g;
  const map = new Map();
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, year, month, name, datetime] = m;
    map.set(`${year}-${Number(month)}-${name}`, {
      year: Number(year),
      month: Number(month),
      solarTermName: name,
      datetime,
    });
  }
  return map;
}

// ──────────────────────────────────────────────
// KASI fetch + 디스크 캐시
// ──────────────────────────────────────────────
async function fetchKasiYear(year) {
  const cacheFile = resolve(CACHE_DIR, `${year}.json`);
  if (existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf-8'));
  }

  const url = new URL(API_BASE);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('solYear', String(year));
  url.searchParams.set('numOfRows', '30');
  url.searchParams.set('_type', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status} for year ${year}`);
  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`JSON parse failed for ${year}: ${text.slice(0, 200)}`);
  }

  const header = json?.response?.header;
  if (header?.resultCode && header.resultCode !== '00') {
    throw new Error(`KASI 에러 [${year}] ${header.resultCode}: ${header.resultMsg ?? ''}`);
  }

  const itemsRaw = json?.response?.body?.items?.item;
  const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];

  const yearData = { year, fetchedAt: new Date().toISOString(), items };

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(yearData, null, 2));
  return yearData;
}

function parseKasiDateTime(item) {
  const d = String(item.locdate);
  const y = d.slice(0, 4);
  const mo = d.slice(4, 6);
  const da = d.slice(6, 8);

  const kst = item.kst ? String(item.kst).trim().padStart(4, '0') : null;
  if (kst && /^\d{4}$/.test(kst)) {
    const h = kst.slice(0, 2);
    const mi = kst.slice(2, 4);
    return { iso: `${y}-${mo}-${da}T${h}:${mi}:00+09:00`, hasTime: true };
  }
  return { iso: `${y}-${mo}-${da}T00:00:00+09:00`, hasTime: false };
}

const diffMin = (a, b) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60000);

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const startYear = Number(args[0] ?? 2000);
  const endYear = Number(args[1] ?? 2027);

  console.log(`\n🔭 KASI 교차검증: ${startYear} ~ ${endYear} (${endYear - startYear + 1}년)\n`);

  const ours = loadJeolipIndex();
  console.log(`   ours JEOLIP_DATA: ${ours.size} entries\n`);

  const allMismatches = [];
  const overrides = {};
  let totalCompared = 0;
  let totalKasiHasTime = 0;
  let totalMissingFromKasi = 0;
  let totalMissingFromOurs = 0;

  for (let year = startYear; year <= endYear; year++) {
    let yearData;
    try {
      yearData = await fetchKasiYear(year);
    } catch (e) {
      console.error(`  [${year}] FETCH FAIL: ${e.message}`);
      continue;
    }

    const yearMismatches = [];
    let yearCompared = 0;

    for (const item of yearData.items) {
      const meta = JEOL_12[item.dateName];
      if (!meta) continue;

      const { iso: kasiIso, hasTime } = parseKasiDateTime(item);
      const solarMonth = Number(String(item.locdate).slice(4, 6));

      // KASI 데이터 오류 방어: 절기명에 맞지 않는 월 항목 무시
      // (예: 2000-02-19 우수가 dateName="입춘"으로 들어옴)
      if (solarMonth !== meta.solarMonth) continue;

      const key = `${year}-${solarMonth}-${item.dateName}`;
      const oursEntry = ours.get(key);
      if (!oursEntry) {
        totalMissingFromOurs++;
        continue;
      }

      yearCompared++;
      totalCompared++;
      if (hasTime) totalKasiHasTime++;

      let mismatch = false;
      let diff = null;

      if (hasTime) {
        diff = diffMin(oursEntry.datetime, kasiIso);
        if (Math.abs(diff) > 0) mismatch = true;
      } else {
        const oursDate = oursEntry.datetime.slice(0, 10);
        const kasiDate = kasiIso.slice(0, 10);
        if (oursDate !== kasiDate) mismatch = true;
      }

      if (mismatch) {
        const m = {
          year,
          solarMonth,
          termName: item.dateName,
          ours: oursEntry.datetime,
          kasi: kasiIso,
          hasKasiTime: hasTime,
          diffMinutes: diff,
        };
        yearMismatches.push(m);
        allMismatches.push(m);
        if (hasTime) overrides[key] = kasiIso;
      }
    }

    const presentNames = new Set(yearData.items.map((i) => i.dateName));
    for (const name of Object.keys(JEOL_12)) {
      if (!presentNames.has(name)) totalMissingFromKasi++;
    }

    const status =
      yearMismatches.length === 0 ? '✅' : yearMismatches.some((m) => m.hasKasiTime) ? '⚠️ ' : '·';
    console.log(`  [${year}] ${status} 비교 ${yearCompared}건, 불일치 ${yearMismatches.length}건`);
    for (const m of yearMismatches) {
      const diffStr = m.diffMinutes !== null ? `${m.diffMinutes}분 차이` : '날짜 다름(KASI 시각 없음)';
      console.log(
        `         · ${m.termName} ours=${m.ours.slice(0, 16)}  kasi=${m.kasi.slice(0, 16)}  (${diffStr})`,
      );
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`📊 결과 요약`);
  console.log(`   비교 케이스: ${totalCompared}건`);
  console.log(`   KASI 시각 포함: ${totalKasiHasTime}건 (${((totalKasiHasTime / Math.max(1, totalCompared)) * 100).toFixed(1)}%)`);
  console.log(`   불일치: ${allMismatches.length}건`);
  console.log(`   KASI 응답 누락: ${totalMissingFromKasi}건`);
  console.log(`   ours 누락: ${totalMissingFromOurs}건`);

  if (Object.keys(overrides).length > 0) {
    writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));
    console.log(`\n✏️  ${Object.keys(overrides).length}건의 보정값을 ${OVERRIDES_PATH} 에 기록`);
  } else {
    console.log(`\n🎉 시각 단위 불일치 0건 — overrides 불필요`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
