/**
 * 엽전 패키지 카드 컴포넌트
 * 조선시대 전통 디자인
 */

import React from 'react';
import { YeopjeonCard } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { CreditPackage } from '../../../constants/pricing';

interface YeopjeonPackageProps {
  package: CreditPackage;
  onPurchase: (pkg: CreditPackage) => void;
  loading?: boolean;
}

export const YeopjeonPackage: React.FC<YeopjeonPackageProps> = ({
  package: pkg,
  onPurchase,
  loading = false
}) => {
  return (
    <YeopjeonCard
      popular={pkg.popular}
      bestValue={pkg.bestValue}
      className="h-full"
    >
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="text-center mb-6">
          {/* 아이콘 */}
          <div className="text-5xl mb-3">{pkg.icon}</div>

          {/* 계급 */}
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-primary">{pkg.name}</h3>
            <p className="text-sm text-text-secondary">{pkg.rank}</p>
          </div>
        </div>

        {/* 가격 */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-primary mb-1">
            {pkg.price.toLocaleString()}원
          </div>
          <div className="text-sm text-text-secondary">
            {pkg.description}
          </div>
        </div>

        {/* 크레딧 정보 */}
        <div className="bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">기본 엽전</span>
            <span className="font-bold text-primary">🪙 {pkg.baseCredit}</span>
          </div>
          {pkg.bonusCredit > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary">보너스 엽전</span>
              <span className="font-bold text-accent">🪙 +{pkg.bonusCredit}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text">총 엽전</span>
              <span className="font-bold text-accent text-lg">
                🪙 {pkg.totalCredit}
              </span>
            </div>
          </div>
        </div>

        {/* 기능 목록 */}
        <div className="flex-1 mb-6">
          <ul className="space-y-2">
            {pkg.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
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

        {/* 구매 버튼 */}
        <Button
          variant={pkg.popular || pkg.bestValue ? 'accent' : 'primary'}
          fullWidth
          size="lg"
          onClick={() => onPurchase(pkg)}
          loading={loading}
        >
          구매하기
        </Button>
      </div>
    </YeopjeonCard>
  );
};

/**
 * 패키지 비교 테이블 (선택사항)
 */
export const PackageComparison: React.FC = () => {
  return (
    <div className="card-hanji p-6 rounded-xl">
      <h3 className="text-xl font-bold text-primary mb-4">엽전으로 할 수 있는 일</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-text-secondary">만세력 확인 + 기본 해석</span>
          <span className="font-bold text-primary">🪙 0 (무료)</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-text-secondary">오늘의 운세</span>
          <span className="font-bold text-primary">🪙 1</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-text-secondary">타로 리딩</span>
          <span className="font-bold text-primary">🪙 1</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-text-secondary">사주 상세 해석</span>
          <span className="font-bold text-primary">🪙 2</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-text-secondary">애정운 / 재물운 특화</span>
          <span className="font-bold text-primary">🪙 2</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-text-secondary">사주 × 타로 하이브리드</span>
          <span className="font-bold text-accent">🪙 3</span>
        </div>
      </div>
    </div>
  );
};
