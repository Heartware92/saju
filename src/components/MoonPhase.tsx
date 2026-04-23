'use client';

/**
 * 현재 한국(KST) 기준 달의 위상에 맞춰 달 모양을 렌더.
 *
 * 원리
 *  - Asia/Seoul 기준 날짜 → lunar-javascript 로 음력일(1~30) 획득
 *  - 음력일 → phase(0~1): 1=삭(new)·15=보름(full)·30=그믐(new)
 *  - SVG path로 밝은 부분(lit)을 그림. 어두운 부분은 뒤 원으로 처리.
 *
 * 기하 공식 (표준 moon-phase 알고리즘)
 *  - 기본 반원(semicircle): waxing → 오른쪽, waning → 왼쪽
 *  - 터미네이터 타원: rx = |cos(2π·phase)| · R
 *    · 음력 1(phase 0):       rx = R  → 반원 ∩ 타원 = 0  (완전 그믐)
 *    · 음력 7~8(phase 0.25):  rx = 0  → 반원만         (반달)
 *    · 음력 15(phase 0.5):    rx = R  → 완전 보름달
 *  - cos 부호로 타원 bulge 방향(sweep flag) 결정 → 크레센트 vs 기버스 구분
 */

import { useEffect, useState } from 'react';

export interface MoonPhaseProps {
  size?: number;
  /** SSR 기본값 (실제값은 클라이언트에서 덮어씀). 기본 15(보름) */
  fallbackLunarDay?: number;
}

/** 음력일(1~30) → 한국어 위상 이름 */
export function lunarPhaseName(day: number): string {
  if (day <= 1 || day >= 30) return '삭(그믐)';
  if (day <= 3) return '초승달';
  if (day <= 6) return '초승달 지난 뒤';
  if (day <= 8) return '상현달(반달)';
  if (day <= 13) return '상현망';
  if (day <= 16) return '보름달';
  if (day <= 21) return '하현망';
  if (day <= 23) return '하현달(반달)';
  return '그믐달';
}

/** KST 기준 Date 객체 반환 (getFullYear/Month/Date 가 서울 시각으로 나옴) */
function getKSTDate(): Date {
  const now = new Date();
  // UTC ms + KST 오프셋 9시간 = KST ms
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 9 * 3600000);
}

/** 현재 KST 음력일(1~30) 반환. lunar-javascript 동적 import — 번들 크기 영향 최소화 */
async function getCurrentLunarDay(): Promise<number> {
  const { Solar } = await import('lunar-javascript');
  const kst = getKSTDate();
  const solar = Solar.fromYmd(kst.getFullYear(), kst.getMonth() + 1, kst.getDate());
  const lunar = solar.getLunar();
  const day = lunar.getDay();
  // 방어적 clamp
  if (typeof day !== 'number' || isNaN(day)) return 15;
  return Math.max(1, Math.min(30, day));
}

export default function MoonPhase({ size = 76, fallbackLunarDay = 15 }: MoonPhaseProps) {
  const [lunarDay, setLunarDay] = useState<number>(fallbackLunarDay);

  useEffect(() => {
    let cancelled = false;
    getCurrentLunarDay()
      .then(d => { if (!cancelled) setLunarDay(d); })
      .catch(() => { /* 실패 시 fallback 유지 */ });
    return () => { cancelled = true; };
  }, []);

  // ── 엣지 케이스 가드 ─────────────────────────────
  // 삭(음력 1/30) = 달이 안 보이는 상태 → 배경에서 사라지면 안 되므로 보름달로 대체.
  // 개기일식은 항상 삭에 발생하므로 이 규칙으로 함께 커버됨.
  // 월식은 보름달에 발생하지만 보름달은 그대로 렌더하면 되므로 별도 처리 불필요.
  // NaN·경계값도 방어적으로 보름달 처리.
  const safeLunarDay = typeof lunarDay === 'number' && !isNaN(lunarDay)
    ? lunarDay
    : 15;
  const isInvisibleNight = safeLunarDay <= 1 || safeLunarDay >= 30;
  /** 화면에 그릴 모양을 결정하는 음력일 — 삭이면 보름달로 fallback */
  const renderDay = isInvisibleNight ? 15 : safeLunarDay;

  const phaseName = lunarPhaseName(safeLunarDay);
  const ariaLabel = isInvisibleNight
    ? `오늘 달: 음력 ${safeLunarDay}일 ${phaseName} — 달이 보이지 않는 날이라 보름달로 표시합니다`
    : `오늘 달: 음력 ${safeLunarDay}일 ${phaseName}`;

  // ── 기하 계산 ────────────────────────────────────
  const R = (size - 8) / 2;          // 실제 달 반지름 (여백 4px)
  const viewR = R + 4;
  const phase = (renderDay - 1) / 29.53;  // 0 ~ 1
  const waxing = phase < 0.5;
  const cos = Math.cos(2 * Math.PI * phase);
  const rx = Math.abs(cos) * R;

  // 기본 반원 sweep: waxing → 오른쪽(1), waning → 왼쪽(0)
  const semiSweep = waxing ? 1 : 0;
  // 터미네이터 타원 sweep: cos 부호에 따라 bulge 방향이 바뀜
  let ellipseSweep: 0 | 1;
  if (waxing) {
    ellipseSweep = cos >= 0 ? 1 : 0;  // 크레센트: 같은 방향 → lens 소멸 / 기버스: 반대 방향 → 추가
  } else {
    ellipseSweep = cos > 0 ? 0 : 1;
  }

  const litPath = `M 0 ${-R} A ${R} ${R} 0 0 ${semiSweep} 0 ${R} A ${rx} ${R} 0 0 ${ellipseSweep} 0 ${-R} Z`;

  return (
    <svg
      viewBox={`${-viewR} ${-viewR} ${2 * viewR} ${2 * viewR}`}
      width={size}
      height={size}
      style={{ display: 'block' }}
      aria-label={ariaLabel}
      role="img"
    >
      <defs>
        <radialGradient id="moon-lit" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="55%" stopColor="#fff0cc" />
          <stop offset="100%" stopColor="#f0d090" />
        </radialGradient>
        <radialGradient id="moon-dark" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#3a2a5a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1a1230" stopOpacity="0.75" />
        </radialGradient>
      </defs>

      {/* 어두운 면 — 배경과 섞이도록 반투명 보라 */}
      <circle r={R} fill="url(#moon-dark)" />

      {/* 밝은 면 */}
      <path
        d={litPath}
        fill="url(#moon-lit)"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(255, 230, 180, 0.35))',
        }}
      />

      {/* 옅은 크레이터 음영 (보름달 가까울 때만 살짝 보이도록 밝은 면 위에) */}
      {renderDay >= 11 && renderDay <= 19 && (
        <g opacity="0.15">
          <circle cx={R * 0.2} cy={-R * 0.15} r={R * 0.12} fill="#8a6a4a" />
          <circle cx={-R * 0.1} cy={R * 0.22} r={R * 0.08} fill="#8a6a4a" />
          <circle cx={R * 0.28} cy={R * 0.28} r={R * 0.06} fill="#8a6a4a" />
        </g>
      )}
    </svg>
  );
}
