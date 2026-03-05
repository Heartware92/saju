'use client';

/**
 * 엽전 구매 페이지
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreditStore } from '@/store/useCreditStore';
import { CREDIT_PACKAGES } from '@/constants/pricing';
import { processPayment } from '@/services/payment';
import type { CreditPackage } from '@/constants/pricing';

export const CreditPurchasePage: React.FC = () => {
  const router = useRouter();
  const { balance } = useCreditStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(pkg.id);

    try {
      const result = await processPayment({
        packageId: pkg.id,
        amount: pkg.price,
        creditAmount: pkg.totalCredit
      });

      if (result.success) {
        alert(`${pkg.name} 패키지 구매가 완료되었습니다!\n🪙 ${pkg.totalCredit} 엽전이 충전되었습니다.`);
      } else {
        alert(result.message || '결제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFBF5',
        padding: '3rem 1rem'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 뒤로 가기 */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#8B4513',
            fontSize: '1rem',
            fontWeight: '600',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '2rem',
            padding: '0.5rem 0'
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          뒤로 가기
        </button>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#8B4513',
              marginBottom: '0.75rem'
            }}
          >
            엽전 충전소
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6B5B4F', marginBottom: '1.5rem' }}>
            상평통보 엽전으로 더 깊은 운세를 알아보세요
          </p>

          {/* 현재 잔액 */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)',
              borderRadius: '2rem',
              border: '2px solid rgba(139, 69, 19, 0.2)'
            }}
          >
            <img src="/coin.png" alt="엽전" style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8B4513' }}>
              {balance} 엽전
            </span>
          </div>
        </div>

        {/* 패키지 그리드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}
        >
          {CREDIT_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onPurchase={handlePurchase}
              loading={loading === pkg.id}
            />
          ))}
        </div>

        {/* 사용 안내 */}
        <div style={{ maxWidth: '700px', margin: '0 auto 3rem' }}>
          <UsageGuide />
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <FAQ />
        </div>
      </div>
    </div>
  );
};

/**
 * 패키지 카드 컴포넌트
 */
const PackageCard: React.FC<{
  pkg: CreditPackage;
  onPurchase: (pkg: CreditPackage) => void;
  loading: boolean;
}> = ({ pkg, onPurchase, loading }) => {
  const isHighlighted = pkg.popular || pkg.bestValue;

  // 패키지별 엽전 피라미드 단수
  const pyramidLevel = {
    pyeongmin: 1,
    jungin: 2,
    yangban: 3,
    panseo: 4
  }[pkg.id] || 1;

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: isHighlighted ? '2px solid #D4A574' : '2px solid rgba(139, 69, 19, 0.15)',
        boxShadow: isHighlighted
          ? '0 8px 24px rgba(139, 69, 19, 0.15)'
          : '0 4px 12px rgba(139, 69, 19, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* 배지 */}
      {isHighlighted && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#D4A574',
            color: '#fff',
            padding: '0.25rem 1rem',
            borderRadius: '1rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            whiteSpace: 'nowrap'
          }}
        >
          {pkg.popular ? '인기' : '최고 가성비'}
        </div>
      )}

      {/* 엽전 아이콘 & 이름 - 고정 높이 */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <CoinPyramid level={pyramidLevel} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8B4513', margin: 0 }}>
          {pkg.name}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#8B7355', margin: '0.25rem 0 0' }}>
          {pkg.rank}
        </p>
      </div>

      {/* 가격 - 고정 높이 */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '65px' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#8B4513' }}>
          {pkg.price.toLocaleString()}원
        </div>
        <p style={{ fontSize: '0.85rem', color: '#8B7355', margin: '0.25rem 0 0', lineHeight: '1.3' }}>
          {pkg.description}
        </p>
      </div>

      {/* 엽전 정보 - 고정 높이 */}
      <div
        style={{
          background: 'rgba(245, 230, 211, 0.5)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1rem',
          minHeight: '120px'
        }}
      >
        {/* 기본 엽전 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '28px' }}>
          <span style={{ color: '#6B5B4F' }}>기본 엽전</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '50px', justifyContent: 'flex-end' }}>
            <img src="/coin.png" alt="" style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: '600', color: '#8B4513', minWidth: '24px', textAlign: 'right' }}>{pkg.baseCredit}</span>
          </div>
        </div>

        {/* 보너스 - 항상 공간 유지 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '28px' }}>
          <span style={{ color: '#6B5B4F', visibility: pkg.bonusCredit > 0 ? 'visible' : 'hidden' }}>보너스</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '50px', justifyContent: 'flex-end', visibility: pkg.bonusCredit > 0 ? 'visible' : 'hidden' }}>
            <img src="/coin.png" alt="" style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: '600', color: '#D4A574', minWidth: '24px', textAlign: 'right' }}>+{pkg.bonusCredit}</span>
          </div>
        </div>

        {/* 총 엽전 */}
        <div
          style={{
            borderTop: '1px solid rgba(139, 69, 19, 0.2)',
            paddingTop: '0.5rem',
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '32px'
          }}
        >
          <span style={{ fontWeight: '600', color: '#4A3728' }}>총 엽전</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '50px', justifyContent: 'flex-end' }}>
            <img src="/coin.png" alt="" style={{ width: 20, height: 20 }} />
            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#D4A574', minWidth: '24px', textAlign: 'right' }}>{pkg.totalCredit}</span>
          </div>
        </div>
      </div>

      {/* 기능 목록 - flex로 남은 공간 채우기 */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', flex: 1, minHeight: '100px' }}>
        {pkg.features.map((feature, idx) => (
          <li
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: '#6B5B4F',
              marginBottom: '0.5rem',
              height: '24px'
            }}
          >
            <span style={{ color: '#D4A574', flexShrink: 0 }}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* 구매 버튼 - 항상 하단 고정 */}
      <button
        onClick={() => onPurchase(pkg)}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.875rem',
          fontSize: '1rem',
          fontWeight: '700',
          color: isHighlighted ? '#fff' : '#8B4513',
          background: isHighlighted
            ? 'linear-gradient(135deg, #8B4513 0%, #654321 100%)'
            : 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)',
          border: 'none',
          borderRadius: '0.75rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          marginTop: 'auto'
        }}
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
    { name: '만세력 확인 + 기본 해석', cost: '무료', isFree: true },
    { name: '오늘의 운세', cost: '1', isFree: false },
    { name: '타로 리딩', cost: '1', isFree: false },
    { name: '사주 상세 해석', cost: '2', isFree: false },
    { name: '애정운 / 재물운 특화', cost: '2', isFree: false },
    { name: '사주 × 타로 하이브리드', cost: '3', isFree: false }
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '2px solid rgba(139, 69, 19, 0.15)'
      }}
    >
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8B4513', marginBottom: '1.5rem' }}>
        엽전으로 할 수 있는 일
      </h3>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 0',
            borderBottom: idx < items.length - 1 ? '1px solid rgba(139, 69, 19, 0.15)' : 'none'
          }}
        >
          <span style={{ color: '#6B5B4F' }}>{item.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '60px', justifyContent: 'flex-end' }}>
            {!item.isFree && <img src="/coin.png" alt="" style={{ width: 18, height: 18 }} />}
            <span style={{ fontWeight: '600', color: '#8B4513' }}>{item.cost}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 엽전 피라미드 컴포넌트
 * level 1 = 1개, level 2 = 3개(1+2), level 3 = 6개(1+2+3), level 4 = 10개(1+2+3+4)
 */
const CoinPyramid: React.FC<{ level: number }> = ({ level }) => {
  // 단수에 따른 코인 크기 조절
  const coinSize = level === 1 ? 40 : level === 2 ? 28 : level === 3 ? 22 : 18;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '0.75rem',
        minHeight: '60px',
        justifyContent: 'center'
      }}
    >
      {Array.from({ length: level }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: rowIdx > 0 ? `-${coinSize * 0.2}px` : 0
          }}
        >
          {Array.from({ length: rowIdx + 1 }).map((_, colIdx) => (
            <img
              key={colIdx}
              src="/coin.png"
              alt=""
              style={{
                width: coinSize,
                height: coinSize,
                marginLeft: colIdx > 0 ? `-${coinSize * 0.15}px` : 0,
                filter: 'drop-shadow(0 2px 3px rgba(139, 69, 19, 0.3))'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * FAQ
 */
const FAQ: React.FC = () => {
  const faqs = [
    {
      q: 'Q. 엽전은 환불이 가능한가요?',
      a: '구매 후 7일 이내, 미사용 엽전에 한해 전액 환불이 가능합니다.'
    },
    {
      q: 'Q. 엽전 유효기간이 있나요?',
      a: '구매하신 엽전은 영구적으로 사용 가능하며 유효기간이 없습니다.'
    },
    {
      q: 'Q. 어떤 결제 방법을 지원하나요?',
      a: '카카오페이, 네이버페이, 토스, 신용카드 등 다양한 결제 수단을 지원합니다.'
    },
    {
      q: 'Q. 보너스 엽전도 같은 기능으로 사용 가능한가요?',
      a: '네, 보너스로 받은 엽전도 구매한 엽전과 동일하게 모든 기능에 사용 가능합니다.'
    }
  ];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '1rem',
        padding: '2rem',
        border: '2px solid rgba(139, 69, 19, 0.15)'
      }}
    >
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8B4513', marginBottom: '1.5rem' }}>
        자주 묻는 질문
      </h3>
      {faqs.map((faq, idx) => (
        <div key={idx} style={{ marginBottom: idx < faqs.length - 1 ? '1.5rem' : 0 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#4A3728', marginBottom: '0.5rem' }}>
            {faq.q}
          </h4>
          <p style={{ fontSize: '0.95rem', color: '#6B5B4F', margin: 0, lineHeight: 1.6 }}>
            {faq.a}
          </p>
        </div>
      ))}
    </div>
  );
};
