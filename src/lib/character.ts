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
  tagline: string;     // 한 줄 요약 (홈 캐릭터 아래 노출)
  traits: string[];    // 3-4개 성향 키워드
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
    tagline: '곧게 뻗는 생장의 기운',
    traits: ['성장 지향', '인자함', '추진력', '계획적'],
  },
  '화': {
    element: '화',
    image: '/characters/fire.png',
    emoji: '🔥',
    label: '불형',
    hanjaElement: '火',
    colorMain: '#F97316',
    colorGlow: 'rgba(251, 191, 36, 0.35)',
    tagline: '빛나고 확장하는 열정',
    traits: ['열정적', '직관력', '표현력', '사교적'],
  },
  '토': {
    element: '토',
    image: '/characters/earth.png',
    emoji: '⛰️',
    label: '흙형',
    hanjaElement: '土',
    colorMain: '#D97706',
    colorGlow: 'rgba(245, 158, 11, 0.35)',
    tagline: '중심을 지키는 포용의 기운',
    traits: ['신뢰감', '안정적', '포용력', '끈기'],
  },
  '금': {
    element: '금',
    image: '/characters/metal.png',
    emoji: '⚔️',
    label: '금속형',
    hanjaElement: '金',
    colorMain: '#9CA3AF',
    colorGlow: 'rgba(229, 231, 235, 0.35)',
    tagline: '단단하고 명확한 절도',
    traits: ['원칙적', '결단력', '정의감', '분석적'],
  },
  '수': {
    element: '수',
    image: '/characters/water.png',
    emoji: '💧',
    label: '물형',
    hanjaElement: '水',
    colorMain: '#3B82F6',
    colorGlow: 'rgba(139, 92, 246, 0.35)',
    tagline: '유연하게 흐르는 지혜',
    traits: ['지혜로움', '적응력', '통찰력', '유연함'],
  },
};

// 천간별 개별 캐릭터 이미지 매핑
export const CHARACTER_IMAGE_BY_STEM: Record<string, string> = {
  '갑': '/characters/갑.png',
  '을': '/characters/을.png',
  '병': '/characters/병.png',
  '정': '/characters/정.png',
  '무': '/characters/무.png',
  '기': '/characters/기.png',
  '경': '/characters/경.png',
  '신': '/characters/신.png',
  '임': '/characters/임.png',
  '계': '/characters/계.png',
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
  const base = CHARACTER_BY_ELEMENT[element];
  const stemImage = CHARACTER_IMAGE_BY_STEM[gan];
  if (!stemImage) return base;
  return { ...base, image: stemImage };
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
