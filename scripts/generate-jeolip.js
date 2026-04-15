/**
 * Generate 절입일 (solar term transition dates) data for years 1920-2050
 * Uses lunar-javascript package for astronomical calculations
 *
 * Usage: node scripts/generate-jeolip.js > /tmp/jeolip-data.ts
 */

const { Lunar, Solar } = require('lunar-javascript');

// The 12 절기 (jie) that mark month transitions in saju
// Map: { chineseKey in jieQiTable, koreanName, solarMonth it falls in, sajuMonth }
const JEOL_TERMS = [
  { key: '小寒', korean: '소한', solarMonth: 1, sajuMonth: 12 },
  { key: '立春', korean: '입춘', solarMonth: 2, sajuMonth: 1 },
  { key: '惊蛰', korean: '경칩', solarMonth: 3, sajuMonth: 2 },
  { key: '清明', korean: '청명', solarMonth: 4, sajuMonth: 3 },
  { key: '立夏', korean: '입하', solarMonth: 5, sajuMonth: 4 },
  { key: '芒种', korean: '망종', solarMonth: 6, sajuMonth: 5 },
  { key: '小暑', korean: '소서', solarMonth: 7, sajuMonth: 6 },
  { key: '立秋', korean: '입추', solarMonth: 8, sajuMonth: 7 },
  { key: '白露', korean: '백로', solarMonth: 9, sajuMonth: 8 },
  { key: '寒露', korean: '한로', solarMonth: 10, sajuMonth: 9 },
  { key: '立冬', korean: '입동', solarMonth: 11, sajuMonth: 10 },
  { key: '大雪', korean: '대설', solarMonth: 12, sajuMonth: 11 },
];

// Uppercase keys used for terms that spill into next/prev year range
const UPPERCASE_KEYS = {
  '小寒': 'XIAO_HAN',
  '大雪': 'DA_XUE',
  '立春': 'LI_CHUN',
  '惊蛰': 'JING_ZHE',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * lunar-javascript 의 Solar.getHour() 는 베이징시(UTC+8) 기준으로 절기 시각을 반환한다.
 * KST(UTC+9) 로 변환하려면 +1 시간 보정 필수.
 * (KASI 24절기 API 와 교차검증으로 확인됨, 2026-04 작업)
 */
function solarToKST(solar) {
  // 베이징시 → Date 객체로 만든 후 +1h → KST ISO
  const y = solar.getYear();
  const m = solar.getMonth();
  const d = solar.getDay();
  const h = solar.getHour();
  const mi = solar.getMinute();
  const beijing = new Date(Date.UTC(y, m - 1, d, h, mi, 0) - 8 * 3600 * 1000);
  const kst = new Date(beijing.getTime() + 9 * 3600 * 1000); // UTC + 9
  return (
    `${kst.getUTCFullYear()}-` +
    `${pad(kst.getUTCMonth() + 1)}-` +
    `${pad(kst.getUTCDate())}T` +
    `${pad(kst.getUTCHours())}:` +
    `${pad(kst.getUTCMinutes())}:00+09:00`
  );
}

function getJieQiTableForYear(year) {
  // To get all 12 jie for a solar year, we need to query multiple lunar years
  // because the jieQi table is organized by lunar year
  // Strategy: get tables from the lunar year that covers most of the solar year
  // and the one before it (for January's 小寒)

  const results = {};

  // For terms Feb-Dec (solarMonth 2-12), use a lunar date in the middle of the solar year
  // Lunar year roughly starts at 立春 (Feb 4), so lunar year = solar year for most months
  try {
    const lunarMid = Lunar.fromYmd(year, 6, 1);
    const tableMid = lunarMid.getJieQiTable();

    for (const term of JEOL_TERMS) {
      if (term.solarMonth >= 2 && term.solarMonth <= 12) {
        const solar = tableMid[term.key];
        if (solar && solar.getYear() === year) {
          results[term.solarMonth] = {
            year: year,
            month: term.solarMonth,
            solarTermName: term.korean,
            datetime: solarToKST(solar),
            sajuMonth: term.sajuMonth,
          };
        }
      }
    }
  } catch (e) {
    // Some lunar years may not have month 6, try month 4
    try {
      const lunarMid = Lunar.fromYmd(year, 4, 1);
      const tableMid = lunarMid.getJieQiTable();
      for (const term of JEOL_TERMS) {
        if (term.solarMonth >= 2 && term.solarMonth <= 12 && !results[term.solarMonth]) {
          const solar = tableMid[term.key];
          if (solar && solar.getYear() === year) {
            results[term.solarMonth] = {
              year: year,
              month: term.solarMonth,
              solarTermName: term.korean,
              datetime: solarToKST(solar),
              sajuMonth: term.sajuMonth,
            };
          }
        }
      }
    } catch (e2) {
      console.error(`Error for year ${year}:`, e2.message);
    }
  }

  // For January's 小寒: it falls in the previous lunar year's range
  // Use a lunar date in the previous year's last months
  if (!results[1]) {
    try {
      const lunarPrev = Lunar.fromYmd(year - 1, 11, 1);
      const tablePrev = lunarPrev.getJieQiTable();

      // Try both regular and uppercase key
      let solar = tablePrev['小寒'];
      if (!solar || solar.getYear() !== year) {
        solar = tablePrev['XIAO_HAN'];
      }
      if (solar && solar.getYear() === year) {
        results[1] = {
          year: year,
          month: 1,
          solarTermName: '소한',
          datetime: solarToKST(solar),
          sajuMonth: 12,
        };
      }
    } catch (e) {
      // fallback
    }
  }

  // Check for any missing months and try alternative approaches
  for (const term of JEOL_TERMS) {
    if (!results[term.solarMonth]) {
      // Try using Solar directly to find the date
      // Search around the expected date for the solar term
      try {
        // Use a date in the middle of the expected month
        const solar = Solar.fromYmd(year, term.solarMonth, 15);
        const lunar = solar.getLunar();
        const table = lunar.getJieQiTable();

        for (const [k, v] of Object.entries(table)) {
          // Match by key (both regular and uppercase variants)
          const normalizedKey = {
            'XIAO_HAN': '小寒', 'DA_XUE': '大雪', 'LI_CHUN': '立春',
            'JING_ZHE': '惊蛰', 'DONG_ZHI': '冬至', 'DA_HAN': '大寒',
            'YU_SHUI': '雨水',
          }[k] || k;

          if (normalizedKey === term.key && v.getYear() === year && v.getMonth() === term.solarMonth) {
            results[term.solarMonth] = {
              year: year,
              month: term.solarMonth,
              solarTermName: term.korean,
              datetime: solarToKST(v),
              sajuMonth: term.sajuMonth,
            };
            break;
          }
        }
      } catch (e) {
        console.error(`Failed to find ${term.korean} for ${year}: ${e.message}`);
      }
    }
  }

  return Object.values(results).sort((a, b) => a.month - b.month);
}

// Generate data for all years
const START_YEAR = 1920;
const END_YEAR = 2050;

const allData = [];

for (let year = START_YEAR; year <= END_YEAR; year++) {
  const yearData = getJieQiTableForYear(year);
  if (yearData.length !== 12) {
    console.error(`WARNING: Year ${year} has ${yearData.length} entries instead of 12`);
    const months = yearData.map(d => d.month);
    for (let m = 1; m <= 12; m++) {
      if (!months.includes(m)) {
        console.error(`  Missing month ${m}`);
      }
    }
  }
  allData.push(...yearData);
}

// Output as TypeScript
const lines = allData.map(d => {
  return `  { year: ${d.year}, month: ${d.month}, solarTermName: '${d.solarTermName}', datetime: '${d.datetime}', sajuMonth: ${d.sajuMonth} },`;
});

// Group by year with comments
let output = '';
let currentYear = null;
for (const d of allData) {
  if (d.year !== currentYear) {
    if (currentYear !== null) output += '\n';
    output += `  // ${d.year}년\n`;
    currentYear = d.year;
  }
  output += `  { year: ${d.year}, month: ${d.month}, solarTermName: '${d.solarTermName}', datetime: '${d.datetime}', sajuMonth: ${d.sajuMonth} },\n`;
}

console.log(output);
