/**
 * POST /api/consultation/sync
 * 상담소 대화를 DB에 저장 (upsert by user_id + conversation_id)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: '세션이 만료되었습니다.' }, { status: 401 });
  }
  const userId = userData.user.id;

  const body = await request.json();
  const { profileId, profileName, conversationId, title, messages } = body;

  if (!conversationId || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'conversationId, messages 필수' }, { status: 400 });
  }

  const messageCount = messages.length;
  const lastMsg = messages[messages.length - 1];
  const lastMessageAt = lastMsg ? new Date(lastMsg.createdAt).toISOString() : null;

  const { error } = await supabaseAdmin.from('consultation_records').upsert(
    {
      user_id: userId,
      profile_id: profileId || null,
      profile_name: profileName || null,
      conversation_id: conversationId,
      title: title || '새 대화',
      messages,
      message_count: messageCount,
      last_message_at: lastMessageAt,
    },
    { onConflict: 'user_id,conversation_id' },
  );

  if (error) {
    console.error('[consultation/sync] upsert error:', error);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
