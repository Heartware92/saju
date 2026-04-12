/**
 * 자미두수(紫微斗數) 지식 베이스 — 불변 상수
 *
 * 14주성, 주요 보좌성, 사화(四化), 12궁 각각의 전통 해석을
 * 구조화된 자료로 고정한다. 프롬프트 생성 시 명반에 실제로 등장한
 * 엔트리만 뽑아 AI에 주입하여, AI가 "어떤 별이 어떤 뜻인지"를
 * 창작하지 않도록 한다.
 *
 * 출처: 자미두수 전통 개론 + iztro 공식 한국어 로케일 용어
 */

// ============================================
// 14 主星 (주성)
// ============================================

export interface MajorStarMeta {
  name: string;           // '자미', '천기' ...
  hanja: string;
  group: '북두' | '남두' | '중천';
  element: string;        // 오행
  polarity: '선' | '중' | '부'; // 길흉 경향 (선=길성계열, 부=흉성계열, 중=중성)
  keywords: string[];     // 3~5개 키워드
  strength: string;       // 강점
  weakness: string;       // 약점
  theme: string;          // 한 줄 테마
}

export const MAJOR_STARS_META: Record<string, MajorStarMeta> = {
  자미: {
    name: '자미', hanja: '紫微', group: '북두', element: '土', polarity: '선',
    keywords: ['제왕', '리더십', '권위', '통솔', '체면'],
    strength: '타고난 품격과 통솔력. 조직의 중심이 되기 쉬움.',
    weakness: '주변의 보좌성이 부족하면 고독하고 독선적이기 쉬움.',
    theme: '왕좌에 앉은 사람 — 보좌가 있어야 진짜 왕이 된다.',
  },
  천기: {
    name: '천기', hanja: '天機', group: '남두', element: '木', polarity: '선',
    keywords: ['지혜', '기획', '분석', '변화', '참모'],
    strength: '머리 회전이 빠르고 전략 수립에 능함. 기획·자문 계열 강점.',
    weakness: '생각이 많아 실행이 늦고, 신경이 예민함.',
    theme: '지혜의 별 — 생각은 많지만 결단이 필요하다.',
  },
  태양: {
    name: '태양', hanja: '太陽', group: '중천', element: '火', polarity: '선',
    keywords: ['명예', '공익', '아버지', '빛', '적극'],
    strength: '외향적이고 공정하며 공적인 일에서 빛남. 남성적 에너지.',
    weakness: '과로와 간섭이 심해지면 번아웃. 야생(夜生)은 힘이 약함.',
    theme: '태양 — 밝게 비추지만 쉬어야 오래 빛난다.',
  },
  무곡: {
    name: '무곡', hanja: '武曲', group: '북두', element: '金', polarity: '선',
    keywords: ['재물', '결단', '금속', '군인', '실천'],
    strength: '추진력과 재물 관리 능력. 금융·재무·기술직 적합.',
    weakness: '딱딱하고 정이 적어 인간관계가 경직됨.',
    theme: '장수의 별 — 재물과 결단, 그러나 따뜻함이 부족.',
  },
  천동: {
    name: '천동', hanja: '天同', group: '남두', element: '水', polarity: '선',
    keywords: ['복록', '온화', '향유', '안주', '복성'],
    strength: '성품이 유순하고 복을 타고남. 서비스·문화·예술 친화.',
    weakness: '게으름과 무기력에 빠지기 쉬움. 도전 정신 부족.',
    theme: '복의 별 — 편안함에 안주하지 말 것.',
  },
  염정: {
    name: '염정', hanja: '廉貞', group: '북두', element: '火', polarity: '중',
    keywords: ['감정', '예술', '집착', '매력', '도화'],
    strength: '감성이 풍부하고 매력적. 예술·기획·마케팅 유리.',
    weakness: '감정 기복과 집착. 법·규율과 얽히기 쉬움.',
    theme: '이중성의 별 — 매혹적이지만 자제가 필요.',
  },
  천부: {
    name: '천부', hanja: '天府', group: '남두', element: '土', polarity: '선',
    keywords: ['저장', '안정', '재물', '관리', '중후'],
    strength: '재물·자산 관리에 능하고 인내심이 강함. 부의 창고.',
    weakness: '변화 적응이 느리고 보수적. 기회를 놓치기도.',
    theme: '창고의 별 — 쌓고 지키는 힘.',
  },
  태음: {
    name: '태음', hanja: '太陰', group: '중천', element: '水', polarity: '선',
    keywords: ['감성', '어머니', '재물(잠재)', '섬세', '야음'],
    strength: '세심하고 감성적이며 저축력이 강함. 밤에 빛남.',
    weakness: '주야 비교에 따라 강약 편차. 감정에 휘둘림.',
    theme: '달의 별 — 고요한 힘, 밤에 피어나는 재물.',
  },
  탐랑: {
    name: '탐랑', hanja: '貪狼', group: '북두', element: '木', polarity: '중',
    keywords: ['욕망', '도화', '다재', '사교', '변화'],
    strength: '다재다능, 사교적, 예술·유흥·영업에 강점.',
    weakness: '욕심과 유혹에 약하고 집중 지속이 어려움.',
    theme: '욕망의 별 — 무엇을 원하는가에 따라 천사도 악마도 된다.',
  },
  거문: {
    name: '거문', hanja: '巨門', group: '북두', element: '水', polarity: '부',
    keywords: ['언변', '의심', '논쟁', '전문성', '시비'],
    strength: '언어·논리·연구에 탁월. 법조·교육·언론 유리.',
    weakness: '말로 인한 시비와 구설. 인간관계 갈등.',
    theme: '말의 별 — 칼이 될 수도, 약이 될 수도.',
  },
  천상: {
    name: '천상', hanja: '天相', group: '남두', element: '水', polarity: '선',
    keywords: ['보좌', '의리', '충성', '공정', '봉사'],
    strength: '인정 많고 공정하며 조력자 역할에 탁월.',
    weakness: '주체성이 약해져 남의 일에 끌려다닐 수 있음.',
    theme: '재상의 별 — 보좌할 때 빛난다.',
  },
  천량: {
    name: '천량', hanja: '天梁', group: '남두', element: '土', polarity: '선',
    keywords: ['원로', '구제', '청렴', '고독', '장수'],
    strength: '정직·청렴하고 어려움 속에서 버팀. 의료·상담·교육 적합.',
    weakness: '고집과 고독. 젊어서는 고생이 따르기 쉬움.',
    theme: '음덕의 별 — 위기에서 빛나는 원로.',
  },
  칠살: {
    name: '칠살', hanja: '七殺', group: '남두', element: '金', polarity: '부',
    keywords: ['돌파', '장수', '개척', '고독', '위엄'],
    strength: '강한 추진력과 개척 정신. 창업·군·경찰 적합.',
    weakness: '독단과 충돌. 인간관계 마찰.',
    theme: '장군의 별 — 홀로 나아가는 용기.',
  },
  파군: {
    name: '파군', hanja: '破軍', group: '북두', element: '水', polarity: '부',
    keywords: ['파괴', '개혁', '변혁', '모험', '선봉'],
    strength: '낡은 틀을 깨는 변혁력. 혁신·창업·변화 산업에서 빛남.',
    weakness: '파괴 후 재건 없는 경우 상처만 남음. 기복 큼.',
    theme: '선봉의 별 — 부수고 새로 짓는다.',
  },
};

// ============================================
// 주요 보좌성(輔星·佐星) — 6길성 + 4흉성
// ============================================

export interface MinorStarMeta {
  name: string;
  hanja: string;
  category: '6길성' | '4흉성' | '기타';
  effect: string;
}

export const MINOR_STARS_META: Record<string, MinorStarMeta> = {
  좌보: { name: '좌보', hanja: '左輔', category: '6길성', effect: '좌우 보좌 — 귀인·조력자, 리더를 돕는 힘.' },
  우필: { name: '우필', hanja: '右弼', category: '6길성', effect: '실질적 지원 — 협력자·파트너 복.' },
  문창: { name: '문창', hanja: '文昌', category: '6길성', effect: '학문·문서·시험운. 글·계약·발표 유리.' },
  문곡: { name: '문곡', hanja: '文曲', category: '6길성', effect: '예술·감성·언변. 표현력과 매력.' },
  천괴: { name: '천괴', hanja: '天魁', category: '6길성', effect: '주간 귀인 — 윗사람·남성 조력.' },
  천월: { name: '천월', hanja: '天鉞', category: '6길성', effect: '야간 귀인 — 여성·부드러운 조력자.' },
  경양: { name: '경양', hanja: '擎羊', category: '4흉성', effect: '날카로운 경쟁·다툼·상해. 용맹하나 갈등 유발.' },
  타라: { name: '타라', hanja: '陀羅', category: '4흉성', effect: '지체·장애·우회. 일이 느리고 얽힘.' },
  화성: { name: '화성', hanja: '火星', category: '4흉성', effect: '급격한 변동·충동·사고. 불같은 에너지.' },
  영성: { name: '영성', hanja: '鈴星', category: '4흉성', effect: '은근한 타격·예민·걱정. 내재된 긴장.' },
  녹존: { name: '녹존', hanja: '祿存', category: '기타', effect: '재물의 씨앗 — 꾸준한 벌이와 안정.' },
  천마: { name: '천마', hanja: '天馬', category: '기타', effect: '이동·변화·역마. 여행·출장·이직 기운.' },
};

// ============================================
// 사화(四化) — 화록/화권/화과/화기
// ============================================

export interface MutagenMeta {
  name: string;
  hanja: string;
  effect: string;
  positive: string;
  caution: string;
}

export const MUTAGEN_META: Record<string, MutagenMeta> = {
  화록: {
    name: '화록', hanja: '化祿',
    effect: '복록이 붙음 — 돈·기회·즐거움이 해당 궁의 영역으로 흘러듦.',
    positive: '해당 궁 영역에서 이득과 풍요.',
    caution: '과욕·허영으로 흐르면 소모로 끝남.',
  },
  화권: {
    name: '화권', hanja: '化權',
    effect: '권세가 붙음 — 해당 궁의 영역에서 주도권·결정권이 생김.',
    positive: '리더·전문가 역할, 영향력 확대.',
    caution: '독단·완고함으로 마찰.',
  },
  화과: {
    name: '화과', hanja: '化科',
    effect: '명예가 붙음 — 해당 궁 영역에서 평판·시험·인정을 얻음.',
    positive: '학문·문서·명성의 길.',
    caution: '겉치레에 치우치면 실속이 빈약.',
  },
  화기: {
    name: '화기', hanja: '化忌',
    effect: '집착·장애가 붙음 — 해당 궁 영역에 애로·집요함·시비.',
    positive: '위기 대응력, 깊이 파고드는 집중력.',
    caution: '강박·손재·인간관계 파열. 결정적 순간 회피 권장.',
  },
};

// ============================================
// 12궁 역할
// ============================================

export interface PalaceRoleMeta {
  name: string;        // '명궁', '형제궁' ...
  domain: string;      // 주관 영역
  focus: string;       // 관찰 포인트
}

export const PALACE_ROLE_META: Record<string, PalaceRoleMeta> = {
  명궁: { name: '명궁', domain: '본질·성격·인생 방향', focus: '이 사람이 어떤 사람인가 — 주성과 사화를 먼저 본다.' },
  형제궁: { name: '형제궁', domain: '형제자매·가까운 동료', focus: '혈연·동료 관계의 우호/갈등.' },
  부처궁: { name: '부처궁', domain: '배우자·연인·동업자', focus: '장기 파트너의 성향과 궁합.' },
  자녀궁: { name: '자녀궁', domain: '자녀·창작물·제자', focus: '자손운과 창조적 결과물.' },
  재백궁: { name: '재백궁', domain: '돈·유동 재산', focus: '수입원과 소비 성향.' },
  질액궁: { name: '질액궁', domain: '건강·질병·재액', focus: '약한 부위와 재난 유형.' },
  천이궁: { name: '천이궁', domain: '이동·외부 활동·타향', focus: '해외·출장·이사의 길흉.' },
  노복궁: { name: '노복궁', domain: '부하·친구·인맥', focus: '수평 인간관계의 복.' },
  관록궁: { name: '관록궁', domain: '직업·공명·지위', focus: '커리어의 성향과 성패.' },
  전택궁: { name: '전택궁', domain: '부동산·가족 공간', focus: '집·땅·가업.' },
  복덕궁: { name: '복덕궁', domain: '정신세계·취미·복록', focus: '내면의 평안과 여가.' },
  부모궁: { name: '부모궁', domain: '부모·윗사람', focus: '부모와의 관계, 상사 운.' },
};

// ============================================
// 유틸: 명반에서 의미 있는 엔트리만 추출
// ============================================

import type { ZamidusuResult, ZamidusuPalace } from '../zamidusu';

export interface KnowledgeHit {
  majorStars: { palace: string; meta: MajorStarMeta; mutagen?: MutagenMeta }[];
  minorStars: { palace: string; meta: MinorStarMeta }[];
  palaceRoles: PalaceRoleMeta[];
}

/**
 * 명반에 실제 등장한 별/궁만 뽑아서 해설 엔트리를 반환한다.
 * 프롬프트에서 이 결과만 AI에 주입한다 (존재하지 않는 별을 묘사하지 않도록).
 */
export function collectKnowledge(chart: ZamidusuResult): KnowledgeHit {
  const majorStars: KnowledgeHit['majorStars'] = [];
  const minorStars: KnowledgeHit['minorStars'] = [];

  chart.palaces.forEach((p: ZamidusuPalace) => {
    p.majorStars.forEach((s) => {
      const meta = MAJOR_STARS_META[s.name];
      if (meta) {
        const mutagen = s.mutagen ? MUTAGEN_META[s.mutagen] : undefined;
        majorStars.push({ palace: p.name, meta, mutagen });
      }
    });
    p.minorStars.forEach((s) => {
      const meta = MINOR_STARS_META[s.name];
      if (meta) minorStars.push({ palace: p.name, meta });
    });
  });

  // 12궁 역할 — 전부 포함(12개 고정)
  const palaceRoles = chart.palaces
    .map((p) => PALACE_ROLE_META[p.name])
    .filter((x): x is PalaceRoleMeta => !!x);

  return { majorStars, minorStars, palaceRoles };
}
