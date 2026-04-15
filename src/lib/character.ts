/**
 * 일간(日干) 오행 기반 캐릭터 매핑 + 한자 변환
 * - 홈 화면 대표 프로필 시각화에 사용
 * - 이미지는 /public/characters/{wood|fire|earth|metal|water}.png
 *   (미존재 시 이모지 폴백)
 */

export const STEM_TO_HANJA: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
};

export const ZHI_TO_HANJA: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
};

export type Element = '목' | '화' | '토' | '금' | '수';

export const STEM_TO_ELEMENT: Record<string, Element> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

export interface CharacterInfo {
  element: Element;
  image: string;       // /characters/*.png
  emoji: string;       // 이미지 로드 실패 시 폴백
  label: string;       // "나무형" 등 한글 표기
  hanjaElement: string; // 木 / 火 / 土 / 金 / 水
  colorMain: string;
  colorGlow: string;
}

export const CHARACTER_BY_ELEMENT: Record<Element, CharacterInfo> = {
  '목': {
    element: '목',
    image: '/characters/wood.png',
    emoji: '🌿',
    label: '나무형',
    hanjaElement: '木',
    colorMain: '#22C55E',
    colorGlow: 'rgba(74, 222, 128, 0.35)',
  },
  '화': {
    element: '화',
    image: '/characters/fire.png',
    emoji: '🔥',
    label: '불형',
    hanjaElement: '火',
    colorMain: '#F97316',
    colorGlow: 'rgba(251, 191, 36, 0.35)',
  },
  '토': {
    element: '토',
    image: '/characters/earth.png',
    emoji: '⛰️',
    label: '흙형',
    hanjaElement: '土',
    colorMain: '#D97706',
    colorGlow: 'rgba(245, 158, 11, 0.35)',
  },
  '금': {
    element: '금',
    image: '/characters/metal.png',
    emoji: '⚔️',
    label: '금속형',
    hanjaElement: '金',
    colorMain: '#9CA3AF',
    colorGlow: 'rgba(229, 231, 235, 0.35)',
  },
  '수': {
    element: '수',
    image: '/characters/water.png',
    emoji: '💧',
    label: '물형',
    hanjaElement: '水',
    colorMain: '#3B82F6',
    colorGlow: 'rgba(139, 92, 246, 0.35)',
  },
};

/** 만세력 셀(간·지) 배경/전경 색 — 전통 표기: 木=청, 火=적, 土=황, 金=백, 水=흑 */
export const ELEMENT_CELL_COLORS: Record<Element, { bg: string; fg: string }> = {
  '목': { bg: '#22C55E', fg: '#0B2E16' },
  '화': { bg: '#EF4444', fg: '#3B0A0A' },
  '토': { bg: '#F59E0B', fg: '#3B2507' },
  '금': { bg: '#E5E7EB', fg: '#1F2937' },
  '수': { bg: '#111827', fg: '#F3F4F6' },
};

export function getCharacterFromStem(gan: string): CharacterInfo | null {
  const element = STEM_TO_ELEMENT[gan];
  if (!element) return null;
  return CHARACTER_BY_ELEMENT[element];
}

export function stemToHanja(gan: string): string {
  return STEM_TO_HANJA[gan] ?? gan;
}

export function zhiToHanja(zhi: string): string {
  return ZHI_TO_HANJA[zhi] ?? zhi;
}

/** 갑자(甲子) 형태로 기둥 하나를 한자로 */
export function pillarToHanja(gan: string, zhi: string): string {
  return `${stemToHanja(gan)}${zhiToHanja(zhi)}`;
}
