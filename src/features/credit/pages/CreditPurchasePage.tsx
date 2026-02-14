/**
 * 엽전 구매 페이지
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditBalance } from '../components/CreditBalance';
import { YeopjeonPackage, PackageComparison } from '../components/YeopjeonPackage';
import { CREDIT_PACKAGES } from '../../../constants/pricing';
import { processPayment } from '../../../services/payment';
import type { CreditPackage } from '../../../constants/pricing';

export const CreditPurchasePage: React.FC = () => {
  const navigate = useNavigate();
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
        // 결제 성공 - 결과 페이지로 이동 또는 모달 표시
        alert(`${pkg.name} 패키지 구매가 완료되었습니다!\n🪙 ${pkg.totalCredit} 엽전이 충전되었습니다.`);
        // TODO: 성공 모달 또는 페이지로 이동
      } else {
        // 결제 실패
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
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>뒤로 가기</span>
          </button>

          <h1 className="text-4xl font-bold text-primary mb-4">
            엽전 충전소
          </h1>
          <p className="text-text-secondary text-lg mb-6">
            상평통보 엽전으로 더 깊은 운세를 알아보세요
          </p>

          {/* 현재 잔액 */}
          <div className="flex justify-center">
            <CreditBalance showAddButton={false} size="lg" />
          </div>
        </div>

        {/* 패키지 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <YeopjeonPackage
              key={pkg.id}
              package={pkg}
              onPurchase={handlePurchase}
              loading={loading === pkg.id}
            />
          ))}
        </div>

        {/* 사용 안내 */}
        <div className="max-w-2xl mx-auto mb-12">
          <PackageComparison />
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <div className="card-hanji p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-primary mb-6">자주 묻는 질문</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-text mb-2">Q. 엽전은 환불이 가능한가요?</h3>
                <p className="text-text-secondary">
                  구매 후 7일 이내, 미사용 엽전에 한해 전액 환불이 가능합니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-text mb-2">Q. 엽전 유효기간이 있나요?</h3>
                <p className="text-text-secondary">
                  구매하신 엽전은 영구적으로 사용 가능하며 유효기간이 없습니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-text mb-2">Q. 어떤 결제 방법을 지원하나요?</h3>
                <p className="text-text-secondary">
                  카카오페이, 네이버페이, 토스, 신용카드 등 다양한 결제 수단을 지원합니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-text mb-2">Q. 보너스 엽전도 같은 기능으로 사용 가능한가요?</h3>
                <p className="text-text-secondary">
                  네, 보너스로 받은 엽전도 구매한 엽전과 동일하게 모든 기능에 사용 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
