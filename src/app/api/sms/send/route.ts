import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';
import { supabaseAdmin } from '@/services/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^01[016789]\d{7,8}$/.test(phone)) {
      return NextResponse.json(
        { error: '올바른 휴대폰 번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SOLAPI_API_KEY?.trim();
    const apiSecret = process.env.SOLAPI_API_SECRET?.trim();
    const senderPhone = process.env.SOLAPI_SENDER_PHONE?.trim();

    if (!apiKey || !apiSecret || !senderPhone) {
      return NextResponse.json(
        { error: 'SMS 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 기존 미사용 코드 무효화
    await supabaseAdmin
      .from('otp_codes')
      .update({ verified: true })
      .eq('phone', phone)
      .eq('verified', false);

    // 새 코드 저장
    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({ phone, code, expires_at: expiresAt, verified: false });

    if (dbError) {
      console.error('[SMS] DB error:', dbError);
      return NextResponse.json(
        { error: '인증번호 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Solapi SMS 발송
    const solapi = new SolapiMessageService(apiKey, apiSecret);
    await solapi.send([
      {
        to: phone,
        from: senderPhone,
        text: `[이천점] 인증번호 ${code}를 입력해주세요. (5분 이내)`,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[SMS] Send error:', err);
    return NextResponse.json(
      { error: err?.message || '인증번호 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
