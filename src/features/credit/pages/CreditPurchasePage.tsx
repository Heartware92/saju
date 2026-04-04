'use client';

/**
 * 크레딧 충전 페이지 - 코스믹 테마
 * 행성 세트: 별 → 지구 → 화성 → 수성 → 금성
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreditStore } from '@/store/useCreditStore';
import { CREDIT_PACKAGES, CREDIT_COST } from '@/constants/pricing';
import { processPayment } from '@/services/payment';
import type { CreditPackage } from '@/constants/pricing';

export const CreditPurchasePage: React.FC = () => {
  const router = useRouter();
  const { sunBalance, moonBalance } = useCreditStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(pkg.id);
    try {
      const result = await processPayment({
        packageId: pkg.id,
        amount: pkg.price,
        creditAmount: pkg.sunCredit + pkg.moonCredit + pkg.bonusSun + pkg.bonusMoon,
      });

      if (result.success) {
        alert(`${pkg.name} 구매 완료!\n☀️ 해 ${pkg.sunCredit + pkg.bonusSun}개 + 🌙 달 ${pkg.moonCredit + pkg.bonusMoon}개 충전!`);
      } else {
        alert(result.message || '결제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-space-deep py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 text-sm font-medium"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          뒤로 가기
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sun-core via-cta to-moon-halo bg-clip-text text-transparent mb-3">
            우주 기운 충전소
          </h1>
          <p className="text-text-secondary text-lg mb-6">
            행성의 에너지로 운명을 읽어보세요
          </p>

          {/* Current balance */}
          <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-space-surface/80 border border-[var(--border-subtle)] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">☀️</span>
              <span className="text-2xl font-bold text-sun-core">{sunBalance}</span>
              <span className="text-xs text-text-tertiary">해</span>
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🌙</span>
              <span className="text-2xl font-bold text-moon-halo">{moonBalance}</span>
              <span className="text-xs text-text-tertiary">달</span>
            </div>
          </div>
        </div>

        {/* Package grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onPurchase={handlePurchase}
              loading={loading === pkg.id}
            />
          ))}
        </div>

        {/* Usage guide */}
        <div className="max-w-2xl mx-auto mb-12">
          <UsageGuide />
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <FAQ />
        </div>
      </div>
    </div>
  );
};

/**
 * 패키지 카드
 */
const PackageCard: React.FC<{
  pkg: CreditPackage;
  onPurchase: (pkg: CreditPackage) => void;
  loading: boolean;
}> = ({ pkg, onPurchase, loading }) => {
  const isHighlighted = pkg.popular || pkg.bestValue;

  return (
    <div className={`
      relative rounded-2xl p-5 flex flex-col h-full transition-all duration-200
      border bg-space-surface/60 backdrop-blur-sm
      ${isHighlighted
        ? 'border-cta shadow-lg shadow-cta/10 ring-1 ring-cta/20'
        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
      }
    `}>
      {/* Badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cta to-cta-active whitespace-nowrap">
          {pkg.popular ? '인기' : '최고 가성비'}
        </div>
      )}

      {/* Planet icon + name */}
      <div className="text-center mb-4 pt-2">
        <div className="text-4xl mb-2">{pkg.planet}</div>
        <h3 className="text-lg font-bold text-text-primary">{pkg.name}</h3>
        <p className="text-xs text-text-tertiary mt-1">{pkg.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-text-primary">
          {pkg.price.toLocaleString()}<span className="text-sm font-normal text-text-secondary">원</span>
        </div>
      </div>

      {/* Credits breakdown */}
      <div className="rounded-xl bg-space-elevated/40 p-3 mb-4 space-y-2 text-sm flex-1">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">☀️ 해</span>
          <span className="font-bold text-sun-core">
            {pkg.sunCredit}{pkg.bonusSun > 0 && <span className="text-sun-corona"> +{pkg.bonusSun}</span>}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">🌙 달</span>
          <span className="font-bold text-moon-halo">
            {pkg.moonCredit}{pkg.bonusMoon > 0 && <span className="text-moon-shadow"> +{pkg.bonusMoon}</span>}
          </span>
        </div>
        {(pkg.bonusSun > 0 || pkg.bonusMoon > 0) && (
          <div className="pt-1 border-t border-[var(--border-subtle)] text-xs text-text-tertiary text-center">
            보너스 포함
          </div>
        )}
      </div>

      {/* Purchase button */}
      <button
        onClick={() => onPurchase(pkg)}
        disabled={loading}
        className={`
          w-full py-3 rounded-xl font-bold text-sm transition-all
          ${isHighlighted
            ? 'bg-gradient-to-r from-cta to-cta-active text-white hover:opacity-90 hover:shadow-lg hover:shadow-cta/20'
            : 'bg-space-elevated text-text-primary border border-[var(--border-default)] hover:border-cta hover:text-cta'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? '처리중...' : '구매하기'}
      </button>
    </div>
  );
};

/**
 * 사용 안내
 */
const UsageGuide: React.FC = () => {
  const items = [
    { name: '만세력 확인 + 기본 해석', cost: '무료', icon: '🆓' },
    { name: '오늘의 운세', cost: '🌙 1', icon: '' },
    { name: '타로 리딩', cost: '🌙 1', icon: '' },
    { name: '사주 상세 해석', cost: '☀️ 2', icon: '' },
    { name: '애정운 / 재물운 특화', cost: '☀️ 2', icon: '' },
    { name: '사주 × 타로 하이브리드', cost: '☀️ 3', icon: '' },
  ];

  return (
    <div className="rounded-2xl bg-space-surface/60 border border-[var(--border-subtle)] p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-text-primary mb-4">해와 달로 할 수 있는 일</h3>
      <div className="space-y-0">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center py-3 border-b border-[var(--border-subtle)] last:border-0"
          >
            <span className="text-text-secondary text-sm">{item.name}</span>
            <span className="font-semibold text-sm text-text-primary">{item.cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * FAQ
 */
const FAQ: React.FC = () => {
  const faqs = [
    {
      q: '해와 달은 환불이 가능한가요?',
      a: '구매 후 7일 이내, 미사용분에 한해 전액 환불이 가능합니다.',
    },
    {
      q: '해와 달에 유효기간이 있나요?',
      a: '구매하신 크레딧은 영구적으로 사용 가능하며 유효기간이 없습니다.',
    },
    {
      q: '어떤 결제 방법을 지원하나요?',
      a: '카카오페이, 네이버페이, 토스, 신용카드 등 다양한 결제 수단을 지원합니다.',
    },
    {
      q: '보너스 크레딧도 같은 기능으로 사용 가능한가요?',
      a: '네, 보너스로 받은 크레딧도 구매한 것과 동일하게 모든 기능에 사용 가능합니다.',
    },
  ];

  return (
    <div className="rounded-2xl bg-space-surface/60 border border-[var(--border-subtle)] p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-text-primary mb-4">자주 묻는 질문</h3>
      {faqs.map((faq, idx) => (
        <div key={idx} className={idx < faqs.length - 1 ? 'mb-5' : ''}>
          <h4 className="text-sm font-semibold text-text-primary mb-1">Q. {faq.q}</h4>
          <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
        </div>
      ))}
    </div>
  );
};
