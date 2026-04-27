'use client';

/**
 * 공통 뒤로가기 버튼.
 *
 * 동작 우선순위:
 *  1. 명시적 fallback (props.to) 가 있으면 그쪽으로 이동
 *  2. 브라우저 history 가 있으면 router.back()
 *  3. 그 외(외부 직접 URL 진입 등)는 홈으로
 *
 * 페이지 헤더 좌측에 단독 배치하거나, 다른 헤더 요소들 사이에 끼워서 사용.
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
    if (to) {
      router.push(to);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
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
