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
// 주의: 한글 파일명(갑.png 등)은 Vercel 프로덕션에서 404. ASCII 로마자로 매핑.
// (한글 png 파일은 호환을 위해 public/characters/ 에 그대로 두되 사용은 ASCII 파일로)
export const CHARACTER_IMAGE_BY_STEM: Record<string, string> = {
  '갑': '/characters/gap.png',
  '을': '/characters/eul.png',
  '병': '/characters/byeong.png',
  '정': '/characters/jeong.png',
  '무': '/characters/mu.png',
  '기': '/characters/gi.png',
  '경': '/characters/gyeong.png',
  '신': '/characters/sin.png',
  '임': '/characters/im.png',
  '계': '/characters/gye.png',
};

/** 만세력 셀(간·지) 배경/전경 색 — 전통 표기: 木=청, 火=적, 土=황, 金=백, 水=흑 */
export const ELEMENT_CELL_COLORS: Record<Element, { bg: string; fg: string }> = {
  '목': { bg: '#22C55E', fg: '#0B2E16' },
  '화': { bg: '#EF4444', fg: '#3B0A0A' },
  '토': { bg: '#F59E0B', fg: '#3B2507' },
  '금': { bg: '#E5E7EB', fg: '#1F2937' },
  '수': { bg: '#111827', fg: '#F3F4F6' },
};

const STEM_PERSONALITY: Record<string, { tagline: string; traits: string[] }> = {
  '갑': { tagline: '곧게 뻗어 하늘을 향하는 큰 나무', traits: ['리더십', '강직함', '추진력', '우직함'] },
  '을': { tagline: '바람에 흔들려도 꺾이지 않는 덩굴', traits: ['유연함', '적응력', '처세술', '섬세함'] },
  '병': { tagline: '세상을 환히 비추는 태양의 기운', traits: ['열정적', '공명정대', '화려함', '낙천적'] },
  '정': { tagline: '어둠 속 길을 밝히는 촛불', traits: ['섬세함', '집중력', '따뜻함', '내면의 빛'] },
  '무': { tagline: '만물을 품는 넓은 대지', traits: ['신뢰감', '묵직함', '포용력', '중후함'] },
  '기': { tagline: '생명을 키우는 기름진 논밭', traits: ['실용적', '꼼꼼함', '양육', '수용력'] },
  '경': { tagline: '거친 바위를 깎아 만든 강철의 기운', traits: ['결단력', '정의감', '의리', '강인함'] },
  '신': { tagline: '빛을 모아 반짝이는 보석', traits: ['심미안', '예리함', '감수성', '완벽주의'] },
  '임': { tagline: '끝없이 흘러 바다에 이르는 큰 강', traits: ['지혜로움', '포용력', '대범함', '자유로움'] },
  '계': { tagline: '만물을 적시는 고요한 이슬', traits: ['직관력', '감성적', '섬세함', '영감'] },
};

export function getCharacterFromStem(gan: string): CharacterInfo | null {
  const element = STEM_TO_ELEMENT[gan];
  if (!element) return null;
  const base = CHARACTER_BY_ELEMENT[element];
  const stemImage = CHARACTER_IMAGE_BY_STEM[gan];
  const personality = STEM_PERSONALITY[gan];
  return {
    ...base,
    ...(stemImage && { image: stemImage }),
    ...(personality && { tagline: personality.tagline, traits: personality.traits }),
  };
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
