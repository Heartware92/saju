/**
 * 프로필 → 만세력 변환 헬퍼
 *
 * - calendar_type === 'lunar' 이면 음력→양력 변환 후 계산
 * - 한국식 30분 시프트 시진 적용 (점신/천을귀인 호환)
 *   · 시진 경계를 11:30 / 13:30 / 15:30 ... 으로 30분 늦춤
 *   · 한국 표준자오선(135°)과 실제 서울(127.5°)의 30분 시차를 시진 자체에 반영
 *   · 진태양시(경도+EOT) 보정은 적용하지 않음 — 시장 표준(점신/포스텔러 등 대중 앱)과 일치
 */

import { Lunar } from 'lunar-javascript';
import type { BirthProfile } from '../types/credit';
import { calculateSaju, type SajuResult } from './sajuCalculator';

export function computeSajuFromProfile(profile: BirthProfile): SajuResult | null {
  try {
    const [y, m, d] = profile.birth_date.split('-').map(Number);
    const unknownTime = !profile.birth_time;
    const [h, min] = unknownTime
      ? [12, 0]
      : (profile.birth_time as string).split(':').map(Number);

    // 1) 음력이면 먼저 양력으로 변환 (시간은 그대로 유지 — 양력 날짜 결정엔 무관)
    let solarYear = y, solarMonth = m, solarDay = d;
    if (profile.calendar_type === 'lunar') {
      const lunar = Lunar.fromYmdHms(y, m, d, h, min, 0);
      const solar = lunar.getSolar();
      solarYear = solar.getYear();
      solarMonth = solar.getMonth();
      solarDay = solar.getDay();
    }

    // 2) 한국식 30분 시프트 — 시계 시간에서 30분 빼서
    //    lunar-javascript 의 정시법 시진(11~13 = 오시) 결과가
    //    한국식 30분 시프트 시진(11:30~13:30 = 오시) 과 같아지도록 조정
    let finalY = solarYear, finalM = solarMonth, finalD = solarDay;
    let finalH = unknownTime ? 12 : h;
    let finalMin = unknownTime ? 0 : min;
    if (!unknownTime) {
      const dt = new Date(solarYear, solarMonth - 1, solarDay, h, min);
      const shifted = new Date(dt.getTime() - 30 * 60 * 1000);
      finalY = shifted.getFullYear();
      finalM = shifted.getMonth() + 1;
      finalD = shifted.getDate();
      finalH = shifted.getHours();
      finalMin = shifted.getMinutes();
    }

    return calculateSaju(
      finalY,
      finalM,
      finalD,
      finalH,
      finalMin,
      profile.gender,
      unknownTime,
    );
  } catch (e) {
    console.error('만세력 계산 실패:', e);
    return null;
  }
}
