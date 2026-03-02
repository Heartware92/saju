/**
 * 입력 검증 모듈
 */

import { UserInput } from '@/types/saju';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 사용자 입력 검증
 */
export function validateInput(input: UserInput): void {
  // 1. 날짜 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(input.birthDate)) {
    throw new ValidationError('날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.');
  }

  // 2. 날짜 유효성 검증
  const [yearStr, monthStr, dayStr] = input.birthDate.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);

  if (year < 1900 || year > 2100) {
    throw new ValidationError('생년은 1900년~2100년 사이여야 합니다.');
  }

  if (month < 1 || month > 12) {
    throw new ValidationError('월은 1~12 사이여야 합니다.');
  }

  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) {
    throw new ValidationError(`${month}월의 일자는 1~${maxDay} 사이여야 합니다.`);
  }

  // 3. 시간 형식 검증
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(input.birthTime)) {
    throw new ValidationError('시간 형식이 올바르지 않습니다. HH:mm 형식으로 입력해주세요.');
  }

  // 4. 성별 검증
  if (input.gender !== '남' && input.gender !== '여') {
    throw new ValidationError('성별은 "남" 또는 "여"여야 합니다.');
  }

  // 5. 역법 검증
  if (input.calendarType !== '양력' && input.calendarType !== '음력') {
    throw new ValidationError('역법은 "양력" 또는 "음력"이어야 합니다.');
  }

  // 6. 출생지 검증
  if (!input.birthPlace || input.birthPlace.trim() === '') {
    throw new ValidationError('출생지를 입력해주세요.');
  }
}

/**
 * 날짜 문자열의 유효성 검증 (간단 버전)
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 시간 문자열의 유효성 검증 (간단 버전)
 */
export function isValidTimeString(timeString: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}
