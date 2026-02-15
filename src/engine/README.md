# 사주 명리학 규칙 엔진

사주 계산 결과를 분석하여 격국, 용신, 해석을 생성하는 심볼릭 규칙 엔진입니다.

## 구조

```
src/engine/
├── index.ts          # 메인 엔진 (진입점)
├── types.ts          # 타입 정의
├── gyeokguk.ts       # 격국 판정 엔진
├── yongsin.ts        # 용신 분석 엔진
├── interpretation.ts # 해석 템플릿 매칭
└── README.md         # 이 파일
```

## 사용법

```typescript
import { calculateSaju } from '../utils/sajuCalculator';
import { analyzeWithRuleEngine, generateUserPrompt } from './engine';

// 1. 사주 계산
const saju = calculateSaju(1990, 5, 15, 10, 30, 'male');

// 2. 규칙 엔진 분석
const result = analyzeWithRuleEngine(saju);

// 3. 결과 사용
console.log(result.gyeokguk);       // 격국 정보
console.log(result.yongsin);        // 용신 분석
console.log(result.interpretations); // 카테고리별 해석
console.log(result.confirmedFacts);  // AI에게 전달할 확정 사실

// 4. AI 프롬프트 생성 (선택)
const prompt = generateUserPrompt(result, {
  name: '홍길동',
  concern: '직업',
  question: '어떤 일이 적성에 맞을까요?'
});
```

## 핵심 개념

### 격국 (格局)
월지를 기준으로 사주의 구조를 판정합니다.
- 내격 10격: 정관격, 편관격, 정인격, 편인격, 정재격, 편재격, 식신격, 상관격, 건록격, 양인격
- 외격: 종격, 화격 등 (추후 추가)

### 용신 (用神)
일간을 돕거나 조절하는 가장 필요한 오행입니다.
- 억부법: 신강/신약에 따라 억제 또는 보조
- 조후법: 계절에 따른 한난조습 조절
- 통관법: 대립 오행 사이 중재

### 확정 사실 (ConfirmedFacts)
AI에게 전달하여 hallucination을 방지하는 검증된 사실들입니다.

## Supabase 테이블 (선택사항)

더 많은 규칙을 Supabase에서 관리하려면 아래 테이블을 생성하세요:

```sql
-- 격국 규칙 테이블
CREATE TABLE saju_gyeokguk_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_hanja VARCHAR(100),
  type VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 100,
  conditions JSONB NOT NULL,
  traits TEXT[],
  careers TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 해석 템플릿 테이블
CREATE TABLE saju_interpretation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  template TEXT NOT NULL,
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 확장 방법

1. **격국 추가**: `gyeokguk.ts`의 `GYEOKGUK_DEFINITIONS` 배열에 추가
2. **용신 규칙 추가**: `yongsin.ts`의 조후/통관 정의 수정
3. **해석 템플릿 추가**: `interpretation.ts`의 템플릿 배열에 추가
4. **Supabase 연동**: 위 테이블 생성 후 런타임에서 로드

## 특징

- **심볼릭 계산**: LLM 없이 결정론적 결과 보장
- **확장 가능**: JSON/JSONB 기반 규칙으로 쉬운 확장
- **AI 친화적**: ConfirmedFacts로 hallucination 방지
- **타입 안전**: TypeScript 완전 지원
