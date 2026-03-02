/**
 * 60갑자 데이터
 * 천간(10) × 지지(12) = 60 조합
 */

import { Pillar } from '@/types/saju';

export interface GapjaEntry extends Pillar {
  number: number;
  name: string;
  ganOhaeng: string;
  jiOhaeng: string;
}

// 60갑자 테이블
export const GAPJA: GapjaEntry[] = [
  { number: 1, gan: '갑', ji: '자', name: '갑자', ganOhaeng: '목', jiOhaeng: '수' },
  { number: 2, gan: '을', ji: '축', name: '을축', ganOhaeng: '목', jiOhaeng: '토' },
  { number: 3, gan: '병', ji: '인', name: '병인', ganOhaeng: '화', jiOhaeng: '목' },
  { number: 4, gan: '정', ji: '묘', name: '정묘', ganOhaeng: '화', jiOhaeng: '목' },
  { number: 5, gan: '무', ji: '진', name: '무진', ganOhaeng: '토', jiOhaeng: '토' },
  { number: 6, gan: '기', ji: '사', name: '기사', ganOhaeng: '토', jiOhaeng: '화' },
  { number: 7, gan: '경', ji: '오', name: '경오', ganOhaeng: '금', jiOhaeng: '화' },
  { number: 8, gan: '신', ji: '미', name: '신미', ganOhaeng: '금', jiOhaeng: '토' },
  { number: 9, gan: '임', ji: '신', name: '임신', ganOhaeng: '수', jiOhaeng: '금' },
  { number: 10, gan: '계', ji: '유', name: '계유', ganOhaeng: '수', jiOhaeng: '금' },
  { number: 11, gan: '갑', ji: '술', name: '갑술', ganOhaeng: '목', jiOhaeng: '토' },
  { number: 12, gan: '을', ji: '해', name: '을해', ganOhaeng: '목', jiOhaeng: '수' },
  { number: 13, gan: '병', ji: '자', name: '병자', ganOhaeng: '화', jiOhaeng: '수' },
  { number: 14, gan: '정', ji: '축', name: '정축', ganOhaeng: '화', jiOhaeng: '토' },
  { number: 15, gan: '무', ji: '인', name: '무인', ganOhaeng: '토', jiOhaeng: '목' },
  { number: 16, gan: '기', ji: '묘', name: '기묘', ganOhaeng: '토', jiOhaeng: '목' },
  { number: 17, gan: '경', ji: '진', name: '경진', ganOhaeng: '금', jiOhaeng: '토' },
  { number: 18, gan: '신', ji: '사', name: '신사', ganOhaeng: '금', jiOhaeng: '화' },
  { number: 19, gan: '임', ji: '오', name: '임오', ganOhaeng: '수', jiOhaeng: '화' },
  { number: 20, gan: '계', ji: '미', name: '계미', ganOhaeng: '수', jiOhaeng: '토' },
  { number: 21, gan: '갑', ji: '신', name: '갑신', ganOhaeng: '목', jiOhaeng: '금' },
  { number: 22, gan: '을', ji: '유', name: '을유', ganOhaeng: '목', jiOhaeng: '금' },
  { number: 23, gan: '병', ji: '술', name: '병술', ganOhaeng: '화', jiOhaeng: '토' },
  { number: 24, gan: '정', ji: '해', name: '정해', ganOhaeng: '화', jiOhaeng: '수' },
  { number: 25, gan: '무', ji: '자', name: '무자', ganOhaeng: '토', jiOhaeng: '수' },
  { number: 26, gan: '기', ji: '축', name: '기축', ganOhaeng: '토', jiOhaeng: '토' },
  { number: 27, gan: '경', ji: '인', name: '경인', ganOhaeng: '금', jiOhaeng: '목' },
  { number: 28, gan: '신', ji: '묘', name: '신묘', ganOhaeng: '금', jiOhaeng: '목' },
  { number: 29, gan: '임', ji: '진', name: '임진', ganOhaeng: '수', jiOhaeng: '토' },
  { number: 30, gan: '계', ji: '사', name: '계사', ganOhaeng: '수', jiOhaeng: '화' },
  { number: 31, gan: '갑', ji: '오', name: '갑오', ganOhaeng: '목', jiOhaeng: '화' },
  { number: 32, gan: '을', ji: '미', name: '을미', ganOhaeng: '목', jiOhaeng: '토' },
  { number: 33, gan: '병', ji: '신', name: '병신', ganOhaeng: '화', jiOhaeng: '금' },
  { number: 34, gan: '정', ji: '유', name: '정유', ganOhaeng: '화', jiOhaeng: '금' },
  { number: 35, gan: '무', ji: '술', name: '무술', ganOhaeng: '토', jiOhaeng: '토' },
  { number: 36, gan: '기', ji: '해', name: '기해', ganOhaeng: '토', jiOhaeng: '수' },
  { number: 37, gan: '경', ji: '자', name: '경자', ganOhaeng: '금', jiOhaeng: '수' },
  { number: 38, gan: '신', ji: '축', name: '신축', ganOhaeng: '금', jiOhaeng: '토' },
  { number: 39, gan: '임', ji: '인', name: '임인', ganOhaeng: '수', jiOhaeng: '목' },
  { number: 40, gan: '계', ji: '묘', name: '계묘', ganOhaeng: '수', jiOhaeng: '목' },
  { number: 41, gan: '갑', ji: '진', name: '갑진', ganOhaeng: '목', jiOhaeng: '토' },
  { number: 42, gan: '을', ji: '사', name: '을사', ganOhaeng: '목', jiOhaeng: '화' },
  { number: 43, gan: '병', ji: '오', name: '병오', ganOhaeng: '화', jiOhaeng: '화' },
  { number: 44, gan: '정', ji: '미', name: '정미', ganOhaeng: '화', jiOhaeng: '토' },
  { number: 45, gan: '무', ji: '신', name: '무신', ganOhaeng: '토', jiOhaeng: '금' },
  { number: 46, gan: '기', ji: '유', name: '기유', ganOhaeng: '토', jiOhaeng: '금' },
  { number: 47, gan: '경', ji: '술', name: '경술', ganOhaeng: '금', jiOhaeng: '토' },
  { number: 48, gan: '신', ji: '해', name: '신해', ganOhaeng: '금', jiOhaeng: '수' },
  { number: 49, gan: '임', ji: '자', name: '임자', ganOhaeng: '수', jiOhaeng: '수' },
  { number: 50, gan: '계', ji: '축', name: '계축', ganOhaeng: '수', jiOhaeng: '토' },
  { number: 51, gan: '갑', ji: '인', name: '갑인', ganOhaeng: '목', jiOhaeng: '목' },
  { number: 52, gan: '을', ji: '묘', name: '을묘', ganOhaeng: '목', jiOhaeng: '목' },
  { number: 53, gan: '병', ji: '진', name: '병진', ganOhaeng: '화', jiOhaeng: '토' },
  { number: 54, gan: '정', ji: '사', name: '정사', ganOhaeng: '화', jiOhaeng: '화' },
  { number: 55, gan: '무', ji: '오', name: '무오', ganOhaeng: '토', jiOhaeng: '화' },
  { number: 56, gan: '기', ji: '미', name: '기미', ganOhaeng: '토', jiOhaeng: '토' },
  { number: 57, gan: '경', ji: '신', name: '경신', ganOhaeng: '금', jiOhaeng: '금' },
  { number: 58, gan: '신', ji: '유', name: '신유', ganOhaeng: '금', jiOhaeng: '금' },
  { number: 59, gan: '임', ji: '술', name: '임술', ganOhaeng: '수', jiOhaeng: '토' },
  { number: 60, gan: '계', ji: '해', name: '계해', ganOhaeng: '수', jiOhaeng: '수' },
];

/**
 * 60갑자 번호로 조회
 */
export function getGapjaByNumber(num: number): GapjaEntry {
  // 1-60 범위로 정규화
  let normalizedNum = ((num - 1) % 60) + 1;
  if (normalizedNum <= 0) normalizedNum += 60;

  return GAPJA[normalizedNum - 1];
}

/**
 * 천간+지지로 60갑자 번호 조회
 */
export function getGapjaNumber(gan: string, ji: string): number {
  const entry = GAPJA.find(g => g.gan === gan && g.ji === ji);
  return entry ? entry.number : -1;
}
