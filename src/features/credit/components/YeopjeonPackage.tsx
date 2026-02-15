/**
 * 엽전 패키지 카드 컴포넌트
 * 조선시대 전통 디자인
 */

import React from 'react';
import { YeopjeonCard } from '../../../components/ui/Card';
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
            <h3
              className="text-2xl font-bold text-primary"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {pkg.name}
            </h3>
            <p
              className="text-base text-text-secondary font-medium"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {pkg.rank}
            </p>
          </div>
        </div>

        {/* 가격 */}
        <div className="text-center mb-6">
          <div
            className="text-3xl font-bold text-primary mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {pkg.price.toLocaleString()}원
          </div>
          <div
            className="text-base text-text-secondary"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {pkg.description}
          </div>
        </div>

        {/* 크레딧 정보 */}
        <div
          className="rounded-lg p-4 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 230, 211, 0.4) 0%, rgba(237, 213, 184, 0.6) 100%)',
            border: '1px solid rgba(139, 69, 19, 0.15)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
              기본 엽전
            </span>
            <div className="flex items-center gap-1.5">
              <img src="/coin.png" alt="엽전" style={{ width: 20, height: 20 }} />
              <span className="font-bold text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
                {pkg.baseCredit}
              </span>
            </div>
          </div>
          {pkg.bonusCredit > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                보너스 엽전
              </span>
              <div className="flex items-center gap-1.5">
                <img src="/coin.png" alt="엽전" style={{ width: 20, height: 20 }} />
                <span className="font-bold text-accent" style={{ fontFamily: 'var(--font-serif)' }}>
                  +{pkg.bonusCredit}
                </span>
              </div>
            </div>
          )}
          <div
            className="pt-3 mt-3"
            style={{ borderTop: '1.5px solid rgba(139, 69, 19, 0.2)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-text" style={{ fontFamily: 'var(--font-serif)' }}>
                총 엽전
              </span>
              <div className="flex items-center gap-2">
                <img src="/coin.png" alt="엽전" style={{ width: 24, height: 24 }} />
                <span
                  className="font-bold text-accent text-xl"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {pkg.totalCredit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 기능 목록 */}
        <div className="flex-1 mb-6">
          <ul className="space-y-2.5">
            {pkg.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-base text-text-secondary">
                <svg
                  className="w-5 h-5 text-accent flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span style={{ fontFamily: 'var(--font-serif)' }}>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 구매 버튼 */}
        <button
          onClick={() => onPurchase(pkg)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            fontSize: '1.1rem',
            fontWeight: '700',
            color: pkg.popular || pkg.bestValue ? '#FFFBF5' : '#8B4513',
            background: pkg.popular || pkg.bestValue
              ? 'linear-gradient(135deg, #8B4513 0%, #654321 100%)'
              : 'linear-gradient(135deg, rgba(232, 212, 184, 0.6) 0%, rgba(222, 197, 165, 0.85) 100%)',
            border: pkg.popular || pkg.bestValue
              ? '1.5px solid #8B4513'
              : '1.5px solid rgba(139, 69, 19, 0.3)',
            borderRadius: '0.75rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: pkg.popular || pkg.bestValue
              ? '0 3px 10px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 2px 6px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            fontFamily: 'var(--font-serif)',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              if (pkg.popular || pkg.bestValue) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #654321 0%, #4A2F19 100%)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #8B4513 0%, #654321 100%)';
                e.currentTarget.style.color = '#FFFBF5';
                e.currentTarget.style.borderColor = '#8B4513';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              if (pkg.popular || pkg.bestValue) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #8B4513 0%, #654321 100%)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(232, 212, 184, 0.6) 0%, rgba(222, 197, 165, 0.85) 100%)';
                e.currentTarget.style.color = '#8B4513';
                e.currentTarget.style.borderColor = 'rgba(139, 69, 19, 0.3)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? '처리중...' : '구매하기'}
        </button>
      </div>
    </YeopjeonCard>
  );
};

/**
 * 패키지 비교 테이블 (선택사항)
 */
export const PackageComparison: React.FC = () => {
  return (
    <div
      className="p-8 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(245, 230, 211, 0.6) 0%, rgba(237, 213, 184, 0.8) 100%)',
        border: '2px solid rgba(139, 69, 19, 0.2)',
        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
      }}
    >
      <h3
        className="text-2xl font-bold text-primary mb-6"
        style={{
          fontFamily: 'var(--font-serif)',
          textShadow: '0 1px 3px rgba(139, 69, 19, 0.15)'
        }}
      >
        엽전으로 할 수 있는 일
      </h3>
      <div className="space-y-4">
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1.5px solid rgba(139, 69, 19, 0.15)' }}
        >
          <span className="text-text-secondary font-medium text-base" style={{ fontFamily: 'var(--font-serif)' }}>
            만세력 확인 + 기본 해석
          </span>
          <div className="flex items-center gap-2">
            <img src="/coin.png" alt="엽전" style={{ width: 22, height: 22 }} />
            <span className="font-bold text-primary text-base" style={{ fontFamily: 'var(--font-serif)' }}>
              0 (무료)
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1.5px solid rgba(139, 69, 19, 0.15)' }}
        >
          <span className="text-text-secondary font-medium text-base" style={{ fontFamily: 'var(--font-serif)' }}>
            오늘의 운세
          </span>
          <div className="flex items-center gap-2">
            <img src="/coin.png" alt="엽전" style={{ width: 22, height: 22 }} />
            <span className="font-bold text-primary text-base" style={{ fontFamily: 'var(--font-serif)' }}>
              1
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1.5px solid rgba(139, 69, 19, 0.15)' }}
        >
          <span className="text-text-secondary font-medium text-base" style={{ fontFamily: 'var(--font-serif)' }}>
            타로 리딩
          </span>
          <div className="flex items-center gap-2">
            <img src="/coin.png" alt="엽전" style={{ width: 22, height: 22 }} />
            <span className="font-bold text-primary text-base" style={{ fontFamily: 'var(--font-serif)' }}>
              1
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1.5px solid rgba(139, 69, 19, 0.15)' }}
        >
          <span className="text-text-secondary font-medium text-base" style={{ fontFamily: 'var(--font-serif)' }}>
            사주 상세 해석
          </span>
          <div className="flex items-center gap-2">
            <img src="/coin.png" alt="엽전" style={{ width: 22, height: 22 }} />
            <span className="font-bold text-primary text-base" style={{ fontFamily: 'var(--font-serif)' }}>
              2
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1.5px solid rgba(139, 69, 19, 0.15)' }}
        >
          <span className="text-text-secondary font-medium text-base" style={{ fontFamily: 'var(--font-serif)' }}>
            애정운 / 재물운 특화
          </span>
          <div className="flex items-center gap-2">
            <img src="/coin.png" alt="엽전" style={{ width: 22, height: 22 }} />
            <span className="font-bold text-primary text-base" style={{ fontFamily: 'var(--font-serif)' }}>
              2
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-text-secondary font-medium text-base" style={{ fontFamily: 'var(--font-serif)' }}>
            사주 × 타로 하이브리드
          </span>
          <div className="flex items-center gap-2">
            <img src="/coin.png" alt="엽전" style={{ width: 22, height: 22 }} />
            <span className="font-bold text-accent text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
              3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
