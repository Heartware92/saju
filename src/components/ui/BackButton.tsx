'use client';

/**
 * 공통 뒤로가기 버튼.
 *
 * 동작 우선순위(2025-04 수정 — 무한 push 루프 방지):
 *  1. onClick 핸들러가 있으면 그것만 실행 (단계형 페이지)
 *  2. 브라우저 history 가 있으면 router.back() — 정상 흐름의 사용자 의도
 *  3. history 가 비어있으면 (외부 직접 URL 진입 등) props.to fallback URL로
 *  4. to 도 없으면 홈으로
 *
 * 이전엔 props.to 가 있을 때 항상 router.push(to) 였는데,
 * "프로필 설정 → 새 프로필 → 뒤로가기 → 프로필 설정 → 뒤로가기 → 새 프로필 …"
 * 형태의 무한 루프가 발생했음. history.back 을 우선 시도해 누적 push 차단.
 */

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  /** 명시적 fallback 경로. 없으면 history.back / 홈 순. */
  to?: string;
  /**
   * 직접 핸들러 — 단계형 페이지(궁합 등)에서 step 뒤로 가야 할 때.
   * 지정되면 to / history.back 로직은 건너뜀.
   */
  onClick?: () => void;
  /** 접근성용 라벨. */
  label?: string;
  /** 추가 className (위치/색 조정용). */
  className?: string;
}

export function BackButton({ to, onClick, label = '뒤로', className = '' }: BackButtonProps) {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    // 정상 흐름: 브라우저 history 가 있으면 back 우선 → 누적 push 로 인한 무한 루프 방지
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    // 외부 직접 URL 진입 등 history 가 비어있을 때 fallback
    if (to) {
      router.push(to);
      return;
    }
    router.push('/');
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary active:scale-95 transition-all ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
