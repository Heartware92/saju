/**
 * Paywall 모달 - 상세 해석 잠금
 * 크레딧 부족 시 구매 유도하는 핵심 전환 포인트
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { CreditRequired } from '../../credit/components/CreditBalance';
import { useCreditStore } from '../../../store/useCreditStore';

export type FortuneType =
  | 'detailed'        // 상세 해석 (2엽전)
  | 'today'           // 오늘의 운세 (1엽전)
  | 'love'            // 애정운 (2엽전)
  | 'wealth'          // 재물운 (2엽전)
  | 'tarot'           // 타로 (1엽전)
  | 'hybrid';         // 하이브리드 (3엽전)

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
  const navigate = useNavigate();
  const { balance } = useCreditStore();
  const [loading, setLoading] = React.useState(false);

  const config = FORTUNE_CONFIG[type];
  const hasEnoughCredit = balance >= config.cost;

  const handleUnlock = async () => {
    if (!hasEnoughCredit) {
      // 크레딧 부족 - 구매 페이지로 이동
      navigate('/credit');
      return;
    }

    // 크레딧 충분 - 해석 실행
    setLoading(true);
    try {
      await onUnlock();
      onClose();
    } catch (error) {
      console.error('Unlock error:', error);
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
          <h2 className="text-2xl font-bold text-primary mb-2">
            {config.title}
          </h2>
          <p className="text-text-secondary">
            {config.description}
          </p>
        </div>

        {/* 필요 크레딧 */}
        <div className="flex justify-center">
          <CreditRequired amount={config.cost} description="필요" />
        </div>

        {/* 현재 잔액 */}
        <div className="card-hanji p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">현재 보유 엽전</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <span className={`text-xl font-bold ${hasEnoughCredit ? 'text-accent' : 'text-fire'}`}>
                {balance}
              </span>
            </div>
          </div>
        </div>

        {/* 포함 내용 */}
        <div>
          <h3 className="font-bold text-text mb-3">포함 내용</h3>
          <ul className="space-y-2">
            {config.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-text-secondary">
                <svg
                  className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
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

        {/* 크레딧 부족 시 안내 */}
        {!hasEnoughCredit && (
          <div className="bg-fire/10 border border-fire/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-fire mb-1">엽전이 부족합니다</p>
                <p className="text-sm text-text-secondary">
                  {config.cost - balance} 엽전이 더 필요합니다. 엽전을 충전하고 상세 해석을 받아보세요.
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
            variant={hasEnoughCredit ? 'accent' : 'primary'}
            fullWidth
            onClick={handleUnlock}
            loading={loading}
          >
            {hasEnoughCredit ? `🪙 ${config.cost} 엽전 사용하기` : '엽전 충전하러 가기'}
          </Button>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-text-secondary text-center">
          {hasEnoughCredit
            ? '엽전을 사용하면 즉시 상세 해석을 받아볼 수 있습니다.'
            : '첫 구매 시 보너스 엽전을 드립니다!'
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

  return (
    <div
      onClick={onClick}
      className="
        card-hanji p-6 rounded-xl
        cursor-pointer
        hover:shadow-hanji-lg
        transition-all
        border-2 border-dashed border-border
        hover:border-accent
      "
    >
      <div className="text-center space-y-4">
        <div className="text-5xl">🔒</div>
        <div>
          <h3 className="font-bold text-primary mb-2">{config.title}</h3>
          <p className="text-sm text-text-secondary mb-4">{config.description}</p>
          <CreditRequired amount={config.cost} />
        </div>
        <Button variant="accent" fullWidth>
          잠금 해제하기
        </Button>
      </div>
    </div>
  );
};
