/**
 * 만세력 계산 API
 *
 * POST /api/manseryeok/calculate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateManseryeok, formatManseryeokWithHanja, ValidationError } from '@/lib/saju/manseryeok';

// 요청 스키마
const requestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD'),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '시간 형식: HH:mm'),
  birthPlace: z.string().min(1, '출생지 필수'),
  gender: z.enum(['남', '여']),
  calendarType: z.enum(['양력', '음력']),
  isLeapMonth: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 검증
    const input = requestSchema.parse(body);

    // 만세력 계산
    const result = calculateManseryeok(input);

    // 한자 포함 포맷
    const formatted = formatManseryeokWithHanja(result.manseryeok);

    return NextResponse.json({
      success: true,
      data: {
        manseryeok: result.manseryeok,
        formatted,
        meta: result.meta,
        input
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manseryeok calculation error:', error);

    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다.',
            details: error.issues.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        },
        { status: 400 }
      );
    }

    // 커스텀 검증 에러
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        },
        { status: 400 }
      );
    }

    // 기타 에러
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: '만세력 계산 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}

// GET은 사용법 안내
export async function GET() {
  return NextResponse.json({
    message: '만세력 계산 API',
    usage: {
      method: 'POST',
      body: {
        birthDate: 'YYYY-MM-DD (예: 1992-09-14)',
        birthTime: 'HH:mm (예: 13:22)',
        birthPlace: '지역명 (예: 서울, seoul)',
        gender: '남 | 여',
        calendarType: '양력 | 음력',
        isLeapMonth: '(음력 윤달인 경우 true)'
      },
      example: {
        birthDate: '1992-09-14',
        birthTime: '13:22',
        birthPlace: '서울',
        gender: '남',
        calendarType: '양력'
      }
    }
  });
}
