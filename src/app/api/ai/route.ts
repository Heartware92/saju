import { NextRequest, NextResponse } from 'next/server';

// ── Claude (Anthropic) API ──────────────────────────────────────────────────
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

async function callClaude(
  prompt: string,
  maxTokens: number,
  systemPrompt: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('NO_ANTHROPIC_KEY');

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude ${res.status}: ${err?.error?.message || ''}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── Gemini API ──────────────────────────────────────────────────────────────
// gemini-2.0-flash 는 무료 티어에서 15 RPM / 1,500 RPD 제공 (2.5-flash 무료 20 RPD 대비 훨씬 높음)
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(
  prompt: string,
  maxTokens: number,
  systemPrompt: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('NO_GEMINI_KEY');

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? '';
    if (res.status === 429) {
      throw new Error(
        `Gemini 분당 요청 한도(RPM) 초과: .env.local 에 ANTHROPIC_API_KEY 를 추가하면 Claude 로 자동 전환됩니다. (${msg})`,
      );
    }
    throw new Error(`Gemini ${res.status}: ${msg}`);
  }

  const data = await res.json();
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
  // 2.5-flash는 thinking 파트(thought:true)가 parts[0]에 올 수 있으므로 실제 텍스트 파트를 찾아야 함
  const textPart = parts.find((p: any) => p.text && !p.thought) ?? parts[0];
  return textPart?.text ?? '';
}

// ── 메인 핸들러 ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { prompt, maxTokens = 1000, systemPrompt } = await request.json();
    const sys =
      systemPrompt ||
      '당신은 정통 사주명리 전문가입니다. 핵심만 간결하게, 실용적으로 답변하세요. 한국어로 작성하며 이모지는 최소화하세요.';

    // 1순위: Claude (ANTHROPIC_API_KEY 있을 때)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const content = await callClaude(prompt, maxTokens, sys);
        return NextResponse.json({ content });
      } catch (claudeErr: any) {
        console.error('[AI Route] Claude 실패, Gemini로 폴백:', claudeErr.message);
        // Claude 실패 시 Gemini 폴백
      }
    }

    // 2순위: Gemini
    if (process.env.GEMINI_API_KEY) {
      const content = await callGemini(prompt, maxTokens, sys);
      return NextResponse.json({ content });
    }

    return NextResponse.json(
      {
        error:
          '.env.local 에 ANTHROPIC_API_KEY 또는 GEMINI_API_KEY 를 설정해주세요. Claude 추천 (쿼터 제한 없음).',
      },
      { status: 500 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
