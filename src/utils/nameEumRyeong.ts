/**
 * 음령오행(音靈五行) — 한글 초성 → 오행 매핑
 *
 * 전통 성명학 기준:
 *  ㄱㅋ       = 木
 *  ㄴㄷㄹㅌ  = 火
 *  ㅇㅎ       = 土
 *  ㅅㅈㅊ    = 金
 *  ㅁㅂㅍ    = 水
 *  (쌍자음 ㄲ ㄸ ㅃ ㅆ ㅉ 도 동일하게 원음에 맞춤)
 */

type Element = '목' | '화' | '토' | '금' | '수';

const INITIAL_TO_ELEMENT: Record<string, Element> = {
  ㄱ: '목', ㄲ: '목', ㅋ: '목',
  ㄴ: '화', ㄷ: '화', ㄸ: '화', ㄹ: '화', ㅌ: '화',
  ㅇ: '토', ㅎ: '토',
  ㅅ: '금', ㅆ: '금', ㅈ: '금', ㅉ: '금', ㅊ: '금',
  ㅁ: '수', ㅂ: '수', ㅃ: '수', ㅍ: '수',
};

const CHOSUNG_BASE_CODE = 0x1100; // Unicode 초성
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ',
  'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ',
  'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

/**
 * 한글 글자 한 음절 → 초성 추출 → 오행 리턴.
 * 한글이 아닌 문자나 매핑 없는 초성은 null.
 */
export function getElementFromKoreanChar(ch: string): Element | null {
  if (!ch || ch.length === 0) return null;
  const code = ch.charCodeAt(0);
  // 한글 음절(가~힣) 범위: U+AC00 ~ U+D7A3
  if (code < 0xac00 || code > 0xd7a3) return null;
  const syllableIndex = code - 0xac00;
  const chosungIndex = Math.floor(syllableIndex / (21 * 28));
  const chosung = CHOSUNG_LIST[chosungIndex];
  return chosung ? INITIAL_TO_ELEMENT[chosung] ?? null : null;
}

/**
 * 한글 이름 전체 → 각 글자의 오행 배열.
 * 공백·한자·특수문자는 건너뛴다.
 */
export function analyzeKoreanName(name: string): {
  chars: string[];
  elements: Element[];
} {
  const chars: string[] = [];
  const elements: Element[] = [];
  for (const ch of name.trim()) {
    if (ch === ' ' || ch === '\t') continue;
    const el = getElementFromKoreanChar(ch);
    if (el) {
      chars.push(ch);
      elements.push(el);
    }
  }
  return { chars, elements };
}
