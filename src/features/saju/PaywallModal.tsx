'use client';

/**
 * Paywall 모달 - 상세 해석 잠금
 * 크레딧 부족 시 구매 유도하는 핵심 전환 포인트
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CreditRequired } from '@/features/credit/components/CreditBalance';
import { useCreditStore } from '@/store/useCreditStore';
import { useUserStore } from '@/store/useUserStore';

export type FortuneType =
  | 'detailed'        // 상세 해석 (☀️2)
  | 'today'           // 오늘의 운세 (🌙1)
  | 'love'            // 애정운 (☀️2)
  | 'wealth'          // 재물운 (☀️2)
  | 'tarot'           // 타로 (🌙1)
  | 'hybrid';         // 하이브리드 (☀️3)

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => Promise<void>;
  type: FortuneType;
}

const FORTUNE_CONFIG: Record<FortuneType, {
  title: string;
  description: string;
  cost: number;
  features: string[];
}> = {
  detailed: {
    title: '사주 상세 해석',
    description: '대운/세운 분석과 함께 심층적인 사주 풀이를 받아보세요',
    cost: 2,
    features: [
      '종합운 (성격, 삶의 방향)',
      '재물운 (경제적 능력)',
      '애정운 (연애, 결혼)',
      '건강운 (체질, 주의사항)',
      '직업운 (적성, 커리어)',
      '현재 운세 (대운/세운 기반)',
      '맞춤 조언 (실천 가능한 방향)'
    ]
  },
  today: {
    title: '오늘의 운세',
    description: '오늘 하루의 운세와 행운 정보를 확인하세요',
    cost: 1,
    features: [
      '오늘의 종합 운세',
      '오늘 특히 좋은 점',
      '오늘 주의할 점',
      '행운의 색상/방향/시간'
    ]
  },
  love: {
    title: '애정운 특화 분석',
    description: '연애와 결혼운을 집중적으로 분석합니다',
    cost: 2,
    features: [
      '타고난 연애 성향',
      '이상형과 궁합 좋은 타입',
      '연애/결혼 시기',
      '연애 성공 조언'
    ]
  },
  wealth: {
    title: '재물운 특화 분석',
    description: '재복과 경제적 능력을 상세히 분석합니다',
    cost: 2,
    features: [
      '타고난 재복',
      '돈 버는 방식',
      '재물운 좋은 시기',
      '재테크 및 투자 조언'
    ]
  },
  tarot: {
    title: '타로 리딩',
    description: '타로 카드로 현재 상황을 점쳐보세요',
    cost: 1,
    features: [
      '카드의 핵심 메시지',
      '현재 상황 해석',
      '앞으로의 조언'
    ]
  },
  hybrid: {
    title: '사주 × 타로 하이브리드',
    description: '사주와 타로를 결합한 특별한 분석',
    cost: 3,
    features: [
      '사주와 타로의 조화 분석',
      '통합 운세 메시지',
      '구체적 행동 조언',
      '오행 보완 방법'
    ]
  }
};

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  type
}) => {
  const router = useRouter();
  const { sunBalance, fetchBalance } = useCreditStore();
  const { user } = useUserStore();
  const [loading, setLoading] = React.useState(false);

  const config = FORTUNE_CONFIG[type];
  const hasEnoughCredit = sunBalance >= config.cost;
  const isLoggedIn = !!user;

  // 모달 열릴 때 잔액 새로고침
  useEffect(() => {
    if (isOpen) {
      console.log('[PaywallModal] 모달 열림, 잔액 조회 중...');
      console.log('[PaywallModal] 로그인 상태:', isLoggedIn, user?.email);
      fetchBalance();
    }
  }, [isOpen]);

  // 디버깅 로그
  useEffect(() => {
    console.log('[PaywallModal] 현재 해 잔액:', sunBalance, '필요:', config.cost, '충분:', hasEnoughCredit);
  }, [sunBalance, config.cost, hasEnoughCredit]);

  const handleUnlock = async () => {
    console.log('[PaywallModal] 해제 버튼 클릭됨');

    // 로그인 체크
    if (!isLoggedIn) {
      console.log('[PaywallModal] 로그인 필요');
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!hasEnoughCredit) {
      // 크레딧 부족 - 구매 페이지로 이동
      console.log('[PaywallModal] 크레딧 부족, 충전 페이지로 이동');
      router.push('/credit');
      return;
    }

    // 크레딧 충분 - 해석 실행
    console.log('[PaywallModal] 크레딧 충분, 해석 실행');
    setLoading(true);
    try {
      await onUnlock();
      onClose();
    } catch (error) {
      console.error('[PaywallModal] Unlock error:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {config.title}
          </h2>
          <p className="text-text-secondary">
            {config.description}
          </p>
        </div>

        {/* 필요 크레딧 */}
        <div className="flex justify-center">
          <CreditRequired amount={config.cost} creditType="sun" description="필요" />
        </div>

        {/* 현재 잔액 */}
        <div className="rounded-lg bg-space-elevated/40 border border-[var(--border-subtle)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">현재 보유</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span>☀️</span>
                <span className={`text-xl font-bold ${hasEnoughCredit ? 'text-sun-core' : 'text-fire-core'}`}>{sunBalance}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 포함 내용 */}
        <div>
          <h3 className="font-bold text-text-primary mb-3">포함 내용</h3>
          <ul className="space-y-2">
            {config.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-text-secondary">
                <svg
                  className="w-5 h-5 text-cta flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 로그인 필요 안내 */}
        {!isLoggedIn && (
          <div className="bg-cta/10 border border-cta/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="font-bold text-cta mb-1">로그인이 필요합니다</p>
                <p className="text-sm text-text-secondary">
                  상세 해석을 받으시려면 먼저 로그인해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 크레딧 부족 시 안내 */}
        {isLoggedIn && !hasEnoughCredit && (
          <div className="bg-fire-core/10 border border-fire-core/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-fire-core mb-1">해(☀️) 크레딧이 부족합니다</p>
                <p className="text-sm text-text-secondary">
                  {config.cost - sunBalance}개가 더 필요합니다. 충전하고 상세 해석을 받아보세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={onClose}
          >
            닫기
          </Button>
          <Button
            variant={isLoggedIn && hasEnoughCredit ? 'sun' : 'primary'}
            fullWidth
            onClick={handleUnlock}
            loading={loading}
          >
            {!isLoggedIn
              ? '로그인하기'
              : hasEnoughCredit
                ? `☀️ ${config.cost} 해 사용하기`
                : '크레딧 충전하러 가기'}
          </Button>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-text-secondary text-center">
          {!isLoggedIn
            ? '회원가입 시 보너스 달(🌙) 크레딧을 드립니다!'
            : hasEnoughCredit
              ? '크레딧을 사용하면 즉시 상세 해석을 받아볼 수 있습니다.'
              : '첫 구매 시 보너스 크레딧을 드립니다!'
          }
        </p>
      </div>
    </Modal>
  );
};

/**
 * 간단한 잠금 카드 (페이지 내 배치용)
 */
interface LockedCardProps {
  type: FortuneType;
  onClick: () => void;
}

export const LockedCard: React.FC<LockedCardProps> = ({ type, onClick }) => {
  const config = FORTUNE_CONFIG[type];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className="
        bg-space-surface/60 p-5 rounded-xl
        transition-all
        border-2 border-dashed border-[var(--border-subtle)]
        hover:border-cta/50
      "
    >
      <div className="text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <div>
          <h3 className="font-bold text-text-primary text-sm mb-2">{config.title}</h3>
          <p className="text-xs text-text-secondary mb-4">{config.description}</p>
          <CreditRequired amount={config.cost} creditType="sun" />
        </div>
        <Button variant="sun" fullWidth onClick={handleClick}>
          잠금 해제하기
        </Button>
      </div>
    </div>
  );
};
