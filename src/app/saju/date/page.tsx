import { Suspense } from 'react';
import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PeriodFortunePage from '@/pages/PeriodFortunePage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * 지정일 운세 — PeriodFortunePage scope="date" 마운트
 *
 * (이전엔 TodayFortunePage mode="date" 를 마운트했으나, 새 7문장 프롬프트
 * generatePeriodDomainsPrompt 가 적용된 PeriodFortunePage 의 'date' 분기로 변경.
 * 직원 피드백 7번 반영 — 영역별 5문장 → 7문장 구조)
 *
 * 추가 이점:
 * - CalendarPicker 내장
 * - ?date=YYYY-MM-DD 쿼리 자동 처리 (입력 페이지에서 고른 날짜 보존)
 * - 신년/오늘/지정일 동일 컴포넌트 — 유지보수 단일화
 */
export default function DateFortune() {
  return (
    <Layout>
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <PeriodFortunePage scope="date" />
        </Suspense>
      </ProtectedRoute>
    </Layout>
  );
}
