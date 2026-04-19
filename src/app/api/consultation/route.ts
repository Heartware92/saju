/**
 * POST /api/consultation
 *
 * 상담소 챗봇 — 사주 데이터 기반 AI 응답 생성.
 * Auth: Authorization: Bearer <supabase-access-token>
 * Body: { systemPrompt: string, history: ChatMessage[], userMessage: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// 토큰 폭증 방지: 최근 N턴만 유지 (user+assistant 각 N개)
const MAX_HISTORY_TURNS = 10;

// 시스템 프롬프트·질문 길이 방어 (악용 방지)
const MAX_SYSTEM_PROMPT = 8000;
const MAX_USER_MESSAGE = 500;

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API 키가 서버에 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    // ── 사용자 인증 ──
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 });
    }

    const body = await request.json() as {
      systemPrompt?: string;
      history?: ChatMessage[];
      userMessage?: string;
    };
    const { systemPrompt, history = [], userMessage } = body;

    // ── 입력 검증 ──
    if (!systemPrompt || !userMessage) {
      return NextResponse.json(
        { error: '시스템 프롬프트와 질문이 필요합니다.' },
        { status: 400 }
      );
    }
    if (systemPrompt.length > MAX_SYSTEM_PROMPT) {
      return NextResponse.json(
        { error: `시스템 프롬프트가 너무 큽니다 (최대 ${MAX_SYSTEM_PROMPT}자).` },
        { status: 400 }
      );
    }
    if (userMessage.length > MAX_USER_MESSAGE) {
      return NextResponse.json(
        { error: `질문은 최대 ${MAX_USER_MESSAGE}자까지 가능해요.` },
        { status: 400 }
      );
    }

    // ── 히스토리 trim ──
    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS * 2);

    const contents = [
      ...trimmedHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    // ── Gemini 호출 ──
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 1200,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `AI 응답 오류: ${response.status} - ${errorData?.error?.message || ''}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
