import { NextRequest, NextResponse } from 'next/server';

// Vercel Serverless 기본 10초 → 60초로 확장 (자미두수 등 장문 응답 대응)
export const maxDuration = 60;

interface AIResult {
  content: string;
  /** true면 max_tokens 한도에 걸려 응답이 잘림. 호출자에서 안내·재시도 처리 필요. */
  truncated: boolean;
}

// ── Gemini API (단일 제공자) ────────────────────────────────────────────────
// gemini-2.5-flash 사용. Anthropic Claude 폴백 코드는 사용자 결정으로 제거됨
// (Claude 키 미보유 + 향후 도입 계획 없음). OpenAI 폴백은 FEEDBACK_CHECKLIST.md
// "🗓 추후 구현 리스트" 에 보존.
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(
  prompt: string,
  maxTokens: number,
  systemPrompt: string,
): Promise<AIResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('NO_GEMINI_KEY');

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        // Gemini 2.5-flash 기본 thinking 비활성 — 장문 응답에서 TTFB + 총 latency 과대
        // 추가 thinking이 필요한 프롬프트는 maxTokens로 감당
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? '';
    if (res.status === 429) {
      throw new Error('AI 요청이 너무 많아요. 1분 후 다시 시도해주세요.');
    }
    if (res.status >= 500) {
      throw new Error('AI 서비스가 일시적으로 응답하지 않아요. 잠시 후 다시 시도해주세요.');
    }
    throw new Error(`AI 요청 오류 (${res.status}): ${msg || '잠시 후 다시 시도해주세요.'}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts: any[] = candidate?.content?.parts ?? [];
  // 2.5-flash 는 thinking 파트(thought:true) 가 parts[0] 에 올 수 있으므로 실제 텍스트 파트를 찾음
  const textPart = parts.find((p: any) => p.text && !p.thought) ?? parts[0];
  return {
    content: textPart?.text ?? '',
    truncated: candidate?.finishReason === 'MAX_TOKENS',
  };
}

// ── 메인 핸들러 ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { prompt, maxTokens = 1000, systemPrompt } = await request.json();
    const sys =
      systemPrompt ||
      '당신은 정통 사주명리 전문가입니다. 핵심만 간결하게, 실용적으로 답변하세요. 한국어로 작성하며 이모지는 최소화하세요.';

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI 서비스가 설정되어 있지 않아요. 관리자에게 문의해주세요.' },
        { status: 500 },
      );
    }

    const r = await callGemini(prompt, maxTokens, sys);
    return NextResponse.json({ content: r.content, truncated: r.truncated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
