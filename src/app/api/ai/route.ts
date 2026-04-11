import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API 키가 서버에 설정되지 않았습니다. .env.local에 OPENAI_API_KEY를 추가해주세요.' },
      { status: 500 }
    );
  }

  try {
    const { prompt, maxTokens = 1000, systemPrompt } = await request.json();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt || '당신은 정통 사주명리 전문가입니다. 핵심만 간결하게, 실용적으로 답변하세요. 한국어로 작성하며 이모지는 최소화하세요.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `OpenAI API 오류: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
