/**
 * 사주 명리학 규칙 엔진 타입 정의
 */

// ============================================
// 기본 타입
// ============================================

export type OhangType = '목' | '화' | '토' | '금' | '수';
export type YinyangType = '양' | '음';
export type GanType = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';
export type JiType = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';

export type SipseongType =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '편재' | '정재'
  | '편관' | '정관'
  | '편인' | '정인';

export type SipseongCategory = '비겁' | '식상' | '재성' | '관성' | '인성';

// ============================================
// 격국 관련
// ============================================

export interface GyeokgukRule {
  id: string;
  name: string;
  nameHanja?: string;
  type: '내격' | '외격';
  priority: number;
  conditions: GyeokgukCondition;
  description: string;
  traits: string[];
  careers: string[];
  isActive: boolean;
}

export interface GyeokgukCondition {
  type: 'sipseong_in_month' | 'month_branch_is' | 'special';
  sipseong?: SipseongType;
  value?: string;
  check?: string;
  additional?: string[];
}

export interface GyeokgukResult {
  id: string;
  name: string;
  nameHanja?: string;
  type: '내격' | '외격';
  description: string;
  traits: string[];
  careers: string[];
  confidence: number;  // 0-1, 판정 확신도
  reason: string;      // 판정 근거
}

// ============================================
// 용신 관련
// ============================================

export type YongsinMethod = '억부' | '조후' | '통관' | '병약';

export interface YongsinRule {
  id: string;
  name: string;
  method: YongsinMethod;
  priority: number;
  conditions: YongsinCondition;
  result: YongsinResult;
  description: string;
  isActive: boolean;
}

export interface YongsinCondition {
  strengthRange?: [number, number];  // [min, max] 점수
  monthBranch?: JiType[];
  dayMaster?: GanType[];
  elementImbalance?: {
    element: OhangType;
    condition: 'excess' | 'deficient';
  };
}

export interface YongsinResult {
  yongsin: OhangType;
  heeSin: OhangType;
  giSin: OhangType;
  guSin: OhangType;
  method: YongsinMethod;
  reason: string;
}

export interface YongsinAnalysis {
  primary: YongsinResult;
  secondary?: YongsinResult;  // 조후용신 등 보조
  analysis: string;
}

// ============================================
// 해석 관련
// ============================================

export type InterpretationCategory =
  | 'personality'
  | 'career'
  | 'wealth'
  | 'love'
  | 'health'
  | 'overall';

export interface InterpretationTemplate {
  id: string;
  category: InterpretationCategory;
  context: string;
  conditions: Record<string, any>;
  template: string;
  priority: number;
  isActive: boolean;
}

export interface InterpretationContext {
  name?: string;
  gender?: 'male' | 'female';
  age?: number;
  concern?: string;
  gyeokguk: GyeokgukResult;
  yongsin: YongsinAnalysis;
  strength: {
    isStrong: boolean;
    score: number;
    analysis: string;
  };
  // sajuCalculator의 결과도 포함
  [key: string]: any;
}

// ============================================
// 규칙 엔진 결과
// ============================================

export interface RuleEngineResult {
  // 격국
  gyeokguk: GyeokgukResult;

  // 용신
  yongsin: YongsinAnalysis;

  // 해석 (카테고리별)
  interpretations: {
    personality: string;
    career: string;
    wealth: string;
    love: string;
    health: string;
  };

  // AI에게 전달할 확정 사실
  confirmedFacts: ConfirmedFacts;

  // 메타데이터
  metadata: {
    rulesApplied: string[];
    processingTime: number;
    confidence: number;
  };
}

export interface ConfirmedFacts {
  // 기본 정보
  dayMaster: string;
  dayMasterElement: OhangType;
  dayMasterYinyang: YinyangType;

  // 격국
  gyeokguk: string;
  gyeokgukType: '내격' | '외격';

  // 신강/신약
  isStrong: boolean;
  strengthScore: number;

  // 용신
  yongsinElement: OhangType;
  yongsinMethod: YongsinMethod;
  heeSinElement: OhangType;
  giSinElement: OhangType;

  // 오행 분포
  elementDistribution: Record<OhangType, number>;
  strongElement: OhangType;
  weakElement: OhangType;

  // 특이사항
  specialFeatures: string[];
}

// ============================================
// 신살 관련
// ============================================

export interface SinsalRule {
  id: string;
  name: string;
  nameHanja?: string;
  type: 'good' | 'bad' | 'neutral';
  conditions: SinsalCondition;
  description: string;
  interpretation: string;
  isActive: boolean;
}

export interface SinsalCondition {
  type: 'day_branch_combo' | 'year_branch_relation' | 'pillar_combo';
  params: Record<string, any>;
}

// ============================================
// AI 프롬프트 관련
// ============================================

export interface PromptTemplate {
  id: string;
  serviceType: 'comprehensive' | 'daily' | 'compatibility' | 'taegil';
  category?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  isActive: boolean;
}

export interface AIRequest {
  confirmedFacts: ConfirmedFacts;
  interpretations: Record<string, string>;
  userContext: {
    name?: string;
    concern?: string;
    question?: string;
  };
  serviceType: string;
}
