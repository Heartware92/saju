# 사주 서비스 구조 브리핑

> 홈에서 제공 중인 **운세 18종**과 그 아래 돌아가는 **AI 파이프라인 · 만세력 엔진 · 지식베이스 · 크레딧 시스템**을 한 문서에 정리. 회의·리뷰용.
>
> 기준 날짜: 2026-04-24 · 기준 커밋: `main` HEAD · 모든 내용은 실제 코드베이스에서 확인됨.

---

## 한 페이지 요약

| 항목 | 현황 |
|---|---|
| **운세 서비스 총** | 18종 (메인 8 + "더 많은 운세" 10) |
| **실제 운영 중인 LLM** | ⚠ **Google Gemini 2.5 Flash 단일** |
| **설계된 Fallback** | Anthropic Claude Haiku 4.5 — 단, `ANTHROPIC_API_KEY` 미설정으로 **현재 작동 안 함** |
| **OpenAI 관련 코드** | 레거시로 남아있음 · 현재 실행 경로 없음 (후속 과제 참조) |
| **만세력 엔진** | 자체 구현 (1900~2100년, 경도 보정·썸머타임·절입일 반영) |
| **크레딧 체계** | 이원화 — ☀ 해(프리미엄) · 🌙 달(스탠다드) |
| **결제 충전 패키지** | 5종 (2,000원~50,000원) |
| **프롬프트 중앙화** | `src/constants/prompts.ts` 단일 파일 4,073줄 |

### 즉시 의사결정이 필요한 항목

1. **단일 LLM 의존**: 현재 Gemini가 장애/쿼터 초과 시 **전체 서비스 중단**. Claude 또는 OpenAI 폴백 활성화 필요.
2. **프롬프트 캐싱·응답 캐싱 미사용**: 동일 사주·연도 입력 시마다 LLM 재호출. 비용 최적화 여지 큼.
3. **Vercel 환경변수 정리 필요**: 쓰이지 않는 `VITE_OPENAI_API_KEY`(68일 전 Vite 레거시) 존재.

---

## 1. 운세 18종 마스터 테이블

| # | 운세 | 경로 | 크레딧 | 핵심 입력 | 출력 구조 | 지식베이스 의존도 |
|---|------|------|:---:|---|---|:---:|
| 1 | 신년운세 | `/saju/newyear` | ☀ 1 | 원국 + 세운 + 대운 + 대상 연도 | 8 섹션 (총/재물/직장/애정/건강/관계/월별/행운) | 중 |
| 2 | 정통 사주 | `/saju/result` | ☀ 1 | 원국 (4기둥·오행·십신·간여지동·병존·합충·재고) | 9 섹션 (총론/성격/운명/재물/직업/애정/건강/가족/조언) | 고 |
| 3 | 오늘의 운세 | `/saju/today` | ☀ 1 | 원국 + 당일 일진 | 5 섹션 (총운/재물/직업/애정/건강) | 중 |
| 4 | 궁합 | `/saju/gunghap` | ☀ 1 | 본인 + 상대 프로필 + 관계 카테고리 16종 | 단일 텍스트 ~1,000자 | 중 |
| 5 | 지정일 운세 | `/saju/date` | ☀ 1 | 원국 + 선택 날짜 일진 | 5 섹션 (오늘의운세와 동일) | 중 |
| 6 | 택일 | `/saju/taekil` | ☀ 1 | 원국 + 카테고리 8종 + 기간 | AI 추천 단일 텍스트 + 엔진 길흉 캘린더 | 저 |
| 7 | 토정비결 | `/saju/tojeong` | ☀ 1 | 음력 생년월일 + 대상 연도 | 5 섹션 (총운/괘의미/월별/분야별/개운) | **고** (144괘 사전) |
| 8 | 자미두수 | `/saju/zamidusu` | ☀ 1 | 원국 (**시주 필수**) + 명반 계산 | 8 섹션 (첫인상/주성/관계/재물/몸마음/사화/대한/조언) | **최고** (14주성·사화·12궁) |
| 9 | 애정운 | `/saju/more/love` | 🌙 1 | 원국 | 4 단락 (400~550자) | 중 |
| 10 | 재물운 | `/saju/more/wealth` | 🌙 1 | 원국 | 4 단락 (400~550자) | 중 |
| 11 | 직업운 | `/saju/more/career` | 🌙 1 | 원국 | 4 단락 (400~550자) | 중 |
| 12 | 건강운 | `/saju/more/health` | 🌙 1 | 원국 | 4 단락 (350~480자) | 중 |
| 13 | 학업운 | `/saju/more/study` | 🌙 1 | 원국 | 4 단락 (350~480자) | 중 |
| 14 | 귀인운 | `/saju/more/people` | 🌙 1 | 원국 | 4 단락 (400~550자) | 중 |
| 15 | 자녀운 | `/saju/more/children` | 🌙 1 | 원국 | 4 단락 (350~480자) | 중 |
| 16 | 성격분석 | `/saju/more/personality` | 🌙 1 | 원국 | 5 단락 (500~700자) | 고 |
| 17 | **이름풀이** | `/saju/more/name` | 🌙 1 | 원국 + **한글/한자 이름** | 4 단락 (380~580자) | **고** (음령·자원 오행) |
| 18 | **꿈해몽** | `/saju/more/dream` | 🌙 1 | **꿈 텍스트만 (사주 불필요)** | 5 단락 (500~700자) | **최고** (355 심벌 + 역몽·맥락·감정 규칙) |

> ☀ 해 = 프리미엄 크레딧, 🌙 달 = 스탠다드 크레딧  
> 깊이 있는 분석은 ☀, 가벼운/반복형은 🌙

---

## 2. 시스템 아키텍처

```
┌─────────────────────────── Client (Next.js + React) ────────────────────────┐
│                                                                              │
│  HomePage / 각 운세 페이지 / MoreFortunePage                                  │
│         │                                                                    │
│         ▼                                                                    │
│  src/services/fortuneService.ts                                              │
│   - generateXxxPrompt()  ← prompts.ts (4073줄)                               │
│   - callGPT() → POST /api/ai                                                 │
│   - sanitizeAIOutput() — 마크다운·이모지·AI 티 제거                          │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────── Server (Vercel Serverless Function) ──────────────────────┐
│                                                                              │
│  src/app/api/ai/route.ts  (maxDuration = 60s)                                │
│                                                                              │
│   1순위: ANTHROPIC_API_KEY 있으면 → Claude Haiku 4.5  (현재 ❌ 키 없음)      │
│   2순위: GEMINI_API_KEY 있으면   → Gemini 2.5 Flash   (현재 ✅ 실사용)      │
│   (OpenAI 경로는 현재 서버에 없음 — 후속 과제)                                │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
                      ┌────────────┴────────────┐
                      ▼                         ▼
              Anthropic API                Google API
              (대기 상태)                  (실제 트래픽)
```

### 만세력 계산 파이프라인 (운세 호출 전 수행)

```
BirthProfile { date, time?, gender, calendar_type, place }
      │
      ▼
src/utils/profileSaju.ts : computeSajuFromProfile()
      │
      ├─ 음력이면 lunar-javascript → 양력 변환
      ├─ 한국식 30분 시프트
      │
      ▼
src/lib/saju/manseryeok/ (7단계)
  1. 입력 검증 (1900~2100)
  2. 음→양 변환
  3. 경도 보정 (135° - 지역경도) × 4분
  4. 썸머타임 보정
  5. 연주 (입춘 기준)
  6. 월주 (절입일 기준)
  7. 일주·시주 (2000-01-01 기준, 오서전환)
      │
      ▼
SajuResult  ← 모든 운세 프롬프트에 주입되는 표준 페이로드
```

---

## 3. LLM 사용 현황 (실측 기준)

### 3.1 환경변수 실측

| 환경변수 | 로컬 `.env.local` | Vercel Production | 용도 |
|---|:---:|:---:|---|
| `ANTHROPIC_API_KEY` | ❌ | ❌ | Claude — **미설정, 호출 안 됨** |
| `GEMINI_API_KEY` | ✅ | ✅ | Gemini — **유일한 실사용** |
| `OPENAI_API_KEY` | ✅ | ✅ | 서버 코드 경로 없음 — 사용 안 됨 |
| `NEXT_PUBLIC_OPENAI_API_KEY` | ❌ | ❌ | (설계상 위험, 실제 미설정 — 다행) |
| `VITE_OPENAI_API_KEY` | — | ✅ | Vite 레거시 — **정리 대상** |

### 3.2 route.ts 실제 로직 (`src/app/api/ai/route.ts:92~128`)

```typescript
export async function POST(request: NextRequest) {
  const { prompt, maxTokens = 1000, systemPrompt } = await request.json();
  const sys = systemPrompt || '당신은 정통 사주명리 전문가입니다 ...';

  // 1순위: Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const content = await callClaude(prompt, maxTokens, sys);
      return NextResponse.json({ content });
    } catch (claudeErr) {
      console.error('Claude 실패, Gemini로 폴백');
    }
  }

  // 2순위: Gemini
  if (process.env.GEMINI_API_KEY) {
    const content = await callGemini(prompt, maxTokens, sys);
    return NextResponse.json({ content });
  }

  return NextResponse.json({ error: 'API 키 없음' }, { status: 500 });
}
```

### 3.3 현재 호출 흐름

```
모든 운세 18종
   → fortuneService.ts: callGPT()
   → POST /api/ai
   → ANTHROPIC 키 없음 → 건너뜀
   → GEMINI 키 있음 → Gemini 2.5 Flash 호출
   → 응답 받아 sanitizeAIOutput()
   → UI 렌더
```

### 3.4 발견된 코드 리스크

| 위치 | 내용 | 리스크 | 처리 |
|---|---|---|---|
| `src/services/api.ts` | OpenAI 직접 호출 `fetchSajuAnalysis` — **axios 클라이언트 측 호출** | 만일 쓰인다면 API 키가 브라우저 번들에 노출 | 현재 아무도 import 안 함 (데드코드). **후속 과제로 서버측 이관 후 Gemini 폴백으로 활용 예정.** |
| `src/constants/secrets.ts` | `export const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY` | `NEXT_PUBLIC_` prefix = 클라이언트 노출 | 아무도 import 안 함, 해당 ENV도 미설정. 삭제 권장. |
| Vercel ENV `VITE_OPENAI_API_KEY` | Vite 레거시 프로젝트 잔재 | 미사용이지만 혼동 유발 | 삭제 권장 |

---

## 4. 공통 파이프라인

### 4.1 프롬프트 규칙 (모든 운세 공통)

`src/constants/prompts.ts`의 **SYSTEM_PROMPT** + **MORE_COMMON_RULES**:

- **절대 금지**: Markdown(`#`, `**`, 리스트 기호), 이모지, "AI로서" 류 표현
- **톤**: 평서체 "~합니다", 근거 있으면 단정 ("~일 수도" 2회 이하)
- **포맷**: 평문 + 섹션 마커 `[key]\n내용` + 첫 줄 은유 제목 (예: "서리 내린 새벽, 그 아래 피어나는 봄꽃")
- **시기 표현**: "곧" 금지, 구체 월(양력)만 사용
- **데이터 경계**: 주입된 사주/세운/심벌 정보만 사용, 외부 창작 금지 (할루시네이션 방지)
- **응답 후처리**: `sanitizeAIOutput()`로 마크다운·이모지 2중 차단

### 4.2 만세력 엔진 구성 요소

| 모듈 | 역할 |
|---|---|
| `src/lib/saju/manseryeok/validators.ts` | 입력 범위 검증 (1900~2100) |
| `src/lib/saju/manseryeok/lunar-converter.ts` | 음력↔양력 (lunar-javascript) |
| `src/lib/saju/manseryeok/time-adjustment.ts` | 경도·썸머타임 보정 |
| `src/lib/saju/manseryeok/calculate.ts` | 7단계 파이프라인 오케스트레이터 |
| `src/lib/saju/manseryeok/calculators/year-pillar.ts` | 연주 (입춘 기준) |
| `src/lib/saju/manseryeok/calculators/month-pillar.ts` | 월주 (절입일 기준) |
| `src/lib/saju/manseryeok/calculators/day-pillar.ts` | 일주 (60갑자 순환) |
| `src/lib/saju/manseryeok/calculators/hour-pillar.ts` | 시주 (오서전환) |

**시간 모름 처리**: `12:00` 고정 + `hourUnknown=true` → 시주 관련 해석 제한.

### 4.3 공통 지식베이스 파일

| 파일 | 내용 | 적용 범위 |
|---|---|---|
| `src/lib/data/gapja.ts` | 60갑자 전체 엔트리 | 모든 사주 |
| `src/lib/data/constants.ts` | 천간·지지·오행·오호전환·오서전환 | 만세력 계산 |
| `src/lib/data/locations.ts` | 60+ 도시 경도 | 시간 보정 |
| `src/lib/data/jeolip.ts` | 24절기 절입 시각 (1992~2027) | 월주 계산 |
| `src/lib/data/daylight-saving.ts` | 한국 썸머타임 시기 | 시간 보정 |
| `src/constants/gapjaTraits.ts` | 60갑자별 기질·키워드·신살 | 프롬프트 주입 |
| `src/constants/dreamSymbols.ts` | **355개 꿈 심벌** + 역몽·맥락·감정 규칙 | 꿈해몽 전용 |
| `src/lib/character.ts` | 천간/지지 한자, 오행별 캐릭터·색 | 홈 대표 프로필 |
| `src/utils/nameEumRyeong.ts` | 한글 초성 음령오행 (ㄱㅋ=목, ㅇㅎ=토…) | 이름풀이 전용 |
| `src/engine/tojeong/gwae-table.ts` | **144괘 테이블** (등급·원문·월별 키워드) | 토정비결 전용 |
| `src/engine/zamidusu/knowledge.ts` | **14주성·보좌성·사화·12궁** 사전 | 자미두수 전용 |

### 4.4 은유 지식베이스 (METAPHOR_KB)

운세 해석을 자연·우주 이미지로 변환하여 문체 통일:

| 사주 개념 | 은유 |
|---|---|
| 원국 | 별자리 지도 |
| 일간 | 별 하나 |
| 신강/신약 | 보름달 / 초승달 |
| 용신 | 북극성 |
| 대운 | 달의 차고 기움 (10년 주기) |
| 세운 | 하루치 햇빛 (1년 주기) |

---

## 5. 메인 운세 8종 상세

### 5.1 신년운세 — `/saju/newyear`
- **크레딧**: ☀ 1 · **UI**: `src/pages/PeriodFortunePage.tsx`
- **입력**: 원국 + 세운(연간지·12운성·현재 대운) + 월별 12등급 + 도메인 점수 6개
- **프롬프트**: `generateNewyearReportPrompt()`
- **출력 섹션 8개** (`NEWYEAR_SECTION_KEYS`):
  `general` 320~430자 · `wealth` · `career` · `love` · `health` · `relation` · `monthly` (1~12월) · `lucky`

### 5.2 정통 사주 — `/saju/result` (진입: `/saju` → `/saju/input`)
- **크레딧**: ☀ 1 · **UI**: `src/pages/SajuResultPage.tsx`
- **입력**: 원국 (4기둥·오행·십신·간여지동·병존·합충·재고·격국·용신·희신·기신)
- **프롬프트**: `generateJungtongsajuPrompt()`
- **출력 섹션 9개**:
  `overall` 400~500자 · `character` · `fate` · `wealth` · `career` · `love` · `health` · `family` · `advice`
- **특이사항**: 시주 미상 시 경고 배너, 자녀운·말년운 해석 제한

### 5.3 오늘의 운세 — `/saju/today`
- **크레딧**: ☀ 1 · **UI**: `src/pages/TodayFortunePage.tsx`
- **입력**: 원국 + 오늘 일진(간지·오행·12운성) + 원국-일진 합·충·상생·상극
- **출력 섹션 5개** (섹션당 180~280자): `overview` · `wealth` · `career` · `love` · `health`

### 5.4 궁합 — `/saju/gunghap`
- **크레딧**: ☀ 1 · **UI**: `src/pages/GunghapPage.tsx`
- **입력**:
  - 본인 대표 프로필
  - 상대 프로필: 이름 / 생년월일 / 시각? / 성별 / 양음력
  - **관계 카테고리 16종**: 짝사랑 · 썸 · 연인 · 배우자 · X여친/X남친 · X남편/X아내 · 소울메이트 · 라이벌 · 멘토멘티 · 친구 · 부모자녀 · 형제자매 · 직장동료 · 사업파트너 · 아이돌과 팬 · 반려동물 · 직접 입력
- **프롬프트**: 카테고리별 15개 전용 함수 (연인/친구/가족/직장 등 각각)
- **출력**: 단일 텍스트 약 800~1,000자 (섹션 마커 없음)
- **UX**: 4단계 마법사 (카테고리 → 역할 선택 → 상대 정보 → 결과)

### 5.5 지정일 운세 — `/saju/date`
- **크레딧**: ☀ 1
- **실체**: 오늘의 운세의 날짜 파라미터화 버전 (`TodayFortunePage.tsx`의 `mode="date"`)
- 프롬프트·출력은 오늘의 운세와 동일 (일진 날짜만 교체)

### 5.6 택일 — `/saju/taekil`
- **크레딧**: ☀ 1 (AI 추천 시) · **UI**: `src/pages/TaekilPage.tsx`
- **입력**: 원국 + **카테고리 8종**(결혼·이사·개업·수술·소송·입시·채용·투자) + 기간(오늘 ~ +5년)
- **엔진**: `calculateTaekil()` — 날짜별 4단계 길흉(대길·길·평·흉) 자체 산출
- **프롬프트**: `generateTaekilAdvicePrompt()` — AI는 해설·추천 이유만 생성
- **출력**: 단일 텍스트 400~600자 (추천 길일 3~4개 + 피할 패턴 + 선택 기준)
- **UX**: 캘린더 길흉 색상 표시 → 날짜 선택 → "AI 추천" 버튼 수동 호출

### 5.7 토정비결 — `/saju/tojeong`
- **크레딧**: ☀ 1 · **UI**: `src/pages/TojeongResultPage.tsx`
- **입력**: 음력 생년월일 + 대상 연도
- **엔진**: 상·중·하 괘 계산 → **144괘** 중 하나 결정 → 고정 등급 + 12개월 키워드 할당
- **지식베이스**: `src/engine/tojeong/gwae-table.ts` (144괘 전체: 번호·이름·상징·등급·한문 원문·총평·월별 키워드·한 줄 표제)
- **프롬프트**: `generateTojeongPrompt()` — AI는 고정 괘 해설을 확장·풀이
- **출력**: 단일 텍스트 2,400~3,000자, 5섹션 번호 형식 (총운 · 괘 의미 · 월별 · 분야별 · 개운)

### 5.8 자미두수 — `/saju/zamidusu`
- **크레딧**: ☀ 1 · **UI**: `src/pages/ZamidusuResultPage.tsx`
- **입력**: 대표 프로필 (**시주 필수** — 시간 미상이면 진입 차단)
- **엔진**: `calculateZamidusu()` — 12궁 명반 계산 (14주성 + 보좌성 + 사화 + 명궁/신궁 + 오행국 + 대한)
- **지식베이스**: `src/engine/zamidusu/knowledge.ts` (14주성·보좌성·사화·12궁 메타 — AI는 이 사전의 별 해설만 활용, 창작 금지)
- **프롬프트**: `generateZamidusuPrompt()` — 자미두수 전용 은유 ("12궁 = 인생의 12개 방")
- **출력 섹션 8개** (2,500~3,200자):
  `overview` · `core` · `relations` · `wealth` · `body_mind` · `mutagen`(사화) · `daehan`(대한) · `advice`
- **특징**: 최대 복잡도. 12궁 SVG(`StarChart` 컴포넌트) 렌더링 포함

---

## 6. "더 많은 운세" 10종 상세

### 6.1 공통 구조
- **경로 패턴**: `/saju/more/[category]` (동적 라우트, 통합 페이지)
- **크레딧**: 🌙 달 1개 (고정)
- **UI**: `src/pages/MoreFortunePage.tsx`
- **기본 입력**: 원국 + 세운 (`buildMoreFortuneBlock()` 공통 블록)
- **공통 규칙**: `MORE_COMMON_RULES` 6가지 — 은유 제목 / 4단락 구조 / 불릿 3개 / 구체 월 명시

### 6.2 카테고리별 설정 (`src/constants/moreFortunes.ts`)

| id | 한글명 | maxTokens | 추가 입력 | 분량 | 분석 포인트 |
|---|---|:-:|---|---|---|
| love | 애정운 | 1,500 | — | 400~550자 | 일지(배우자궁) · 재성/관성 · 도화·홍염·원진 |
| wealth | 재물운 | 1,500 | — | 400~550자 | 정/편재 · 식상 · 재고(辰戌丑未) |
| career | 직업·진로운 | 1,500 | — | 400~550자 | 격국 · 관성 · 식상 · 인성 · 12운성 |
| health | 건강운 | 1,300 | — | 350~480자 | 약한 오행 → 취약 장부 매핑 · 충·형 |
| study | 학업운 | 1,300 | — | 350~480자 | 인성 · 식상 · 문창/학당/문곡귀인 |
| people | 귀인운 | 1,500 | — | 400~550자 | 비겁 · 인성 · 천을귀인 · 공망 |
| children | 자녀·출산운 | 1,300 | — | 350~480자 | 성별별 자녀성 · 시주 |
| personality | 성격 심층 | 1,800 | — | **500~700자** | 일주 60갑자 · 격국 · 신강신약 · 간여지동 · 병존·삼존 |
| **name** | 이름 풀이 | 1,300~**1,700** | **한글±한자** | 380~580자 | 음령오행 + **자원오행**(한자 시) |
| **dream** | 꿈 해몽 | 1,500 | **꿈 텍스트** | 500~700자 | **사주 불필요** — 355 심벌 사전 매칭 |

### 6.3 이름풀이 특수 로직

**입력 파이프라인**:
1. **한글 이름** (필수) → `analyzeKoreanName()`이 초성 추출 → 음령오행 배열
   - 음령 매핑: ㄱㅋ=목, ㄴㄷㄹㅌ=화, ㅇㅎ=토, ㅅㅈㅊ=금, ㅁㅂㅍ=수
2. **한자 이름** (선택) → 프롬프트에 **부수→오행 규칙 블록** 주입 → LLM이 직접 판정
   - 목: 木·艸·竹·禾·米 / 화: 火·日·光·赤·心 / 토: 土·山·阝·宀 / 금: 金·刀·戈·言 / 수: 水·冫·雨·魚

**출력 강제 규칙**:
- 한글만: 4단락, 380~500자, 사주 조화 분석 중심
- 한자 포함: **첫 줄에 필수 포맷** =
  ```
  자원오행 판정: 許=金(言부, 말씀) · 珍=金(玉부, 보석) · 宇=土(宀부, 집)
  ```
  → 이후 교차 분석 + 개명 권장 여부, 420~580자

### 6.4 꿈해몽 특수 로직

**프로필 독립성**: 사주 원국·세운을 쓰지 **않음**. 꿈 텍스트만으로 해석.

**입력 파이프라인**:
1. **선명 모드**: 꿈 원문 직접 입력 (1,000자 제한)
2. **흐릿 모드**: 7개 칩 그룹(사람·동물·자연·사물·장소·행동·감정) 다중 선택 → 자연어 합성
3. **자동 심벌 매칭**: 사용자 텍스트에서 키워드 길이 기준 상위 5개 추출

**프롬프트 주입 규칙 블록 5종**:
| 블록 | 내용 |
|---|---|
| `DREAM_TYPE_CHECKLIST` | 태몽/예지몽/심리몽 판별 기준 |
| `CONTEXT_RULES` | 10개 행동 맥락 가중 (보다/품다/당하다 등) |
| `EMOTION_RULES` | 7개 감정 수정자 (따뜻함·기쁨 = strong+, 공포 = strong-) |
| `REVERSE_DREAM_NOTES` | **역몽 규칙 3가지** — 죽음·피·똥·불 → 길몽 1순위 검토 |
| `DREAM_FRAMEWORK` | 6단계 해석 프레임 |

**지식베이스**: `src/constants/dreamSymbols.ts` **355개 전통 심벌** (8 카테고리: 동물/자연/신체/행위/인물/사물/숫자·색/감정)
각 심벌 필드: `label` / `keywords`(매칭용) / `tradition`(주공해몽) / `psychology`(현대 상징) / `polarity`(good/bad/neutral/mixed)

**출력 구조 5단락**:
1. 은유 제목 + 꿈 종류 판정 (체크리스트 근거) + 길흉 단정
2. 매칭 심벌 2~3개 인용 + 장면 되짚기
3. 맥락 가중(보/품/당) + 감정 가중 설명
4. 현실 국면 지목 (재물/관계/건강/일/자신 중 1개 단정)
5. 불릿 3개 (1주~1달 할일 / 피할 행동 / 길흉별 조언)

### 6.5 MoreFortunePage 렌더 플로우

```
1. /saju/more/[category] 진입
2. 비로그인 가드 → /login?from= 리다이렉트
3. 대표 프로필 체크 (꿈해몽 제외)
4. 추가 입력 폼 (name: 이름 폼 · dream: DreamInputPanel)
5. [풀이 보기] 버튼 클릭
6. 크레딧 확인 (달 1개) → 부족하면 에러
7. 카테고리별 LOADING_MESSAGES 로테이션 표시 (3~5개 메시지)
8. getXxxShort() / getNameFortune() / getDreamInterpretation() 호출
9. 응답 성공 시 chargeForContent('moon', 1, '더많은운세:xxx') 차감 (선차감 아님)
10. 결과 plain text 렌더
```

---

## 7. 크레딧·결제 시스템

### 7.1 이원화 정책

| 크레딧 | 상징 | 포지션 | 용도 |
|---|:-:|---|---|
| 해 ☀ (`sun`) | 프리미엄 | 깊이 있는 분석 | 메인 운세 8종 |
| 달 🌙 (`moon`) | 스탠다드 | 가벼운 분석 | 더 많은 운세 10종 + 타로 + 상담소 질문 |

### 7.2 충전 패키지 (`src/constants/pricing.ts`)

| 패키지 | 가격 | 해 ☀ | 달 🌙 | 보너스 | 포지션 |
|---|--:|--:|--:|---|---|
| 별 | 2,000원 | 1 | 2 | — | 가볍게 시작 |
| **지구** | 5,000원 | 3 | 5 | 달 +1 | **인기** ⭐ |
| 화성 | 10,000원 | 7 | 10 | 해 +1, 달 +2 | 깊이 있는 탐색 |
| 수성 | 20,000원 | 15 | 20 | 해 +3, 달 +5 | 가족용 |
| 금성 | 50,000원 | 40 | 50 | 해 +10, 달 +15 | 프리미엄 |

### 7.3 차감 원칙

| 원칙 | 설명 |
|---|---|
| 단위 | 한 번의 "의미 있는 결과 확인" = 1회 차감 |
| 시점 | 응답 **성공 후** 차감 (실패 시 차감 없음) |
| 중복 방지 | 자동 호출 페이지는 `useRef` 가드 |
| 새로고침 | 새 마운트로 간주하여 새로 차감 (서비스 특성상 합리적) |

### 7.4 상담소 팩 (특수 구조)

- 1팩 = ☀ 1 또는 🌙 3 소모
- 3질문 사용 가능 (질문당 차감 아님, 팩 단위)
- `useConsultationQuestion()`은 로컬 상태만 감소 (서버 재조회 없음)

---

## 8. 파일 맵

### 8.1 프롬프트 & 설정
| 용도 | 파일 | 규모 |
|---|---|---:|
| 모든 프롬프트 중앙 관리 | `src/constants/prompts.ts` | 4,073줄 |
| 더많은운세 10종 설정 | `src/constants/moreFortunes.ts` | 134줄 |
| 꿈 심벌 사전 | `src/constants/dreamSymbols.ts` | 355 심벌 |
| 60갑자 특성 사전 | `src/constants/gapjaTraits.ts` | — |
| 크레딧 비용 | `src/constants/creditCosts.ts` | — |
| 충전 패키지 | `src/constants/pricing.ts` | 5 패키지 |

### 8.2 AI 호출 레이어
| 용도 | 파일 | 규모 |
|---|---|---:|
| LLM 라우팅 (Claude/Gemini) | `src/app/api/ai/route.ts` | 129줄 |
| 운세별 호출 래퍼 + 프롬프트 조립 | `src/services/fortuneService.ts` | 852줄 |

### 8.3 만세력 엔진
| 용도 | 파일 |
|---|---|
| 메인 7단계 | `src/lib/saju/manseryeok/calculate.ts` |
| 시간 보정 | `src/lib/saju/manseryeok/time-adjustment.ts` |
| 음양력 변환 | `src/lib/saju/manseryeok/lunar-converter.ts` |
| 연/월/일/시주 | `src/lib/saju/manseryeok/calculators/*.ts` |
| 입력 검증 | `src/lib/saju/manseryeok/validators.ts` |

### 8.4 운세 전용 엔진 & 지식
| 용도 | 파일 |
|---|---|
| 토정비결 144괘 | `src/engine/tojeong/gwae-table.ts` |
| 자미두수 14주성·사화·12궁 | `src/engine/zamidusu/knowledge.ts` |
| 택일 길흉 엔진 | `src/engine/taekil/` |
| 타로 덱·해석 | `src/engine/tarot/deck.ts`, `reading.ts` |

### 8.5 UI 페이지
| 운세 | 페이지 파일 |
|---|---|
| 정통사주 | `src/pages/SajuResultPage.tsx` |
| 오늘/지정일 | `src/pages/TodayFortunePage.tsx` |
| 신년 | `src/pages/PeriodFortunePage.tsx` |
| 궁합 | `src/pages/GunghapPage.tsx` |
| 택일 | `src/pages/TaekilPage.tsx` |
| 토정비결 | `src/pages/TojeongResultPage.tsx` |
| 자미두수 | `src/pages/ZamidusuResultPage.tsx` |
| 더많은운세 통합 | `src/pages/MoreFortunePage.tsx` |

---

## 9. 발견된 이슈 & 후속 과제

### 9.1 🔴 High — LLM 단일 의존

**문제**: 현재 모든 운세가 Gemini 2.5 Flash 하나에만 의존. Gemini 쿼터 초과·장애 시 서비스 전면 중단.

**해결 방향** (결정됨, 미구현):
1. 기존 `src/services/api.ts`의 OpenAI 호출을 서버(`/api/ai/route.ts`)로 이관
2. 폴백 순서: Claude → Gemini → OpenAI
3. 응답에 `provider` 필드 추가 (어떤 프로바이더로 처리됐는지)
4. 비-primary provider 사용 시 Supabase `ai_fallback_events` 테이블에 자동 기록
5. **어드민 페이지 최상단에 붉은 경고 배너** (최근 1시간 폴백 발생 시)

### 9.2 🟡 Medium — 비용·성능 최적화 여지

| 항목 | 현황 | 개선 효과 |
|---|---|---|
| Anthropic 프롬프트 캐싱 | 미사용 | 원국 페이로드(수 KB) 반복 전송 비용 절감 |
| 응답 캐싱 | 없음 | 동일 입력 시 LLM 재호출 방지 |
| 스트리밍 | 미사용 | 자미두수·토정비결 같은 장문에서 체감 속도 대폭 개선 여지 |

### 9.3 🟡 Medium — 데드코드 정리

| 항목 | 상태 |
|---|---|
| `src/services/api.ts`의 OpenAI 호출 함수 | 데드 (아무도 import 안 함) · **폴백으로 재활용 예정** |
| `src/constants/secrets.ts` | 데드 · 삭제 권장 (NEXT_PUBLIC_ 보안 설계 위험) |
| Vercel ENV `VITE_OPENAI_API_KEY` | Vite 레거시 · 삭제 권장 |

### 9.4 🟢 Low — UX 개선 제안

- 프로필 로딩 레이턴시(로그인 직후 0.5~1.2초) → 이미 일부 개선됨(`fetchProfiles` 병렬 프리페치). Supabase RPC로 `user + primary_profile` 번들 조회 시 추가 30~50% 단축 가능
- 결과 페이지들(TarotPage, SajuResultPage 등) 보호 라우트 일관화
- 꿈해몽: 비로그인 사용자에게도 체험 허용 가능 (사주 불필요하므로)

---

## 10. Q&A

**Q. 사주 없이 쓸 수 있는 운세는?**  
A. **꿈해몽 단 하나**. 나머지 17종은 대표 프로필 필요. 특히 자미두수는 시주(출생 시간)까지 필수.

**Q. 현재 어떤 AI 모델로 돌아가나?**  
A. **Google Gemini 2.5 Flash 단독.** 코드상 Anthropic Claude 1순위 설계이나 API 키 미설정으로 호출되지 않음.

**Q. 이름풀이에 한자를 넣으면 뭐가 달라지나?**  
A. `maxTokens` 1300→1700 확대, 출력 첫 줄에 `자원오행 판정: 許=金(言부) · ...` 형식 강제. 음령오행(초성) + 자원오행(부수) 교차 분석.

**Q. 궁합은 상대방 프로필을 저장하나?**  
A. 저장하지 않음. 입력값으로 그 자리에서 사주 계산 → 프롬프트 주입. (프라이버시 친화적 설계)

**Q. 토정비결과 신년운세는 어떻게 다른가?**  
A. **신년운세**는 사주 원국·세운·대운 기반 개인 맞춤. **토정비결**은 음력 생년월일로 144괘 중 하나를 뽑아 고정 등급·원문을 풀이. 서로 다른 전통 체계를 그대로 반영.

**Q. 왜 자미두수만 시주가 필수인가?**  
A. 자미두수 명반(命盤)은 **시주 지지로 명궁 위치를 결정**하는 체계. 시주가 없으면 12궁 배치 자체가 불가능.

**Q. 크레딧은 환불되나?**  
A. 별도 환불 로직 없음. `chargeForContent()`는 **응답 성공 후에만** 차감하므로 실패 시에는 애초에 차감되지 않음.

**Q. 프롬프트가 Gemini 맞춤이거나 Claude 맞춤으로 튜닝돼 있나?**  
A. 모델 의존성이 낮은 공통 규칙(평문·이모지 금지·섹션 마커)으로 작성. 현재는 Gemini만 돌지만 다른 모델에서도 작동할 수 있도록 설계됨.

---

## 11. 문서 규칙

- 운영 코드/환경변수 변경 시 이 문서를 함께 업데이트한다.
- 프롬프트(`prompts.ts`) 수정 시 운세별 출력 분량·섹션 개수 변경이 있으면 §1 마스터 테이블 갱신.
- 신규 운세 추가 시 §5(메인) 또는 §6(더많은운세)에 동일 스키마로 섹션 추가.

*최종 작성: 2026-04-24 · 모든 내용은 해당 일자 `main` 브랜치 소스 기준.*
