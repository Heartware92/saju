/**
 * 개인정보처리방침 페이지 — 껍데기.
 * 한국 개인정보보호법상 게시 의무. 우선 placeholder.
 * 실제 처리방침은 추후 채울 예정.
 */

import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

export const metadata = {
  title: '개인정보처리방침 — 사주이천점',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 pt-4 pb-12 max-w-[720px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 px-1">
        <BackButton />
        <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          개인정보처리방침
        </h1>
        <div className="w-9" />
      </div>

      {/* 본문 */}
      <div className="rounded-2xl p-6 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <p className="text-[13px] text-text-tertiary mb-4">
          시행일: 2026-04-29 / 최종 개정일: 2026-04-29
        </p>

        <section className="space-y-5 text-[14px] text-text-secondary leading-relaxed">
          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">1. 개인정보 수집·이용 목적</h2>
            <p>회사는 다음의 목적으로 개인정보를 수집·이용합니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>회원 가입 및 관리, 본인 확인</li>
              <li>서비스(사주명리 풀이) 제공 및 개인 맞춤 결과 생성</li>
              <li>크레딧 결제 및 이용 내역 관리</li>
              <li>고객 문의 및 불만 처리</li>
            </ul>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">2. 수집하는 개인정보 항목</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>필수: 이메일, 비밀번호 (암호화 저장)</li>
              <li>서비스 이용 시 입력: 생년월일, 출생 시간, 출생지, 성별, 이름(프로필명)</li>
              <li>자동 수집: 접속 일시, 서비스 이용 기록</li>
            </ul>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">3. 개인정보 보유·이용 기간</h2>
            <p>
              회원 탈퇴 시까지 보유하며, 탈퇴 즉시 모든 개인정보를 파기합니다.
              단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>전자상거래법: 계약·결제 기록 5년, 소비자 불만·분쟁처리 기록 3년</li>
              <li>통신비밀보호법: 접속 로그 3개월</li>
            </ul>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 회원의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만 결제 처리(PortOne) 등 서비스 제공에 필수적인 경우 동의를 받은 후 제공합니다.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">5. 만 14세 미만 아동의 개인정보</h2>
            <p>
              회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
              가입 시 만 14세 이상임을 확인합니다.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">6. 정보주체의 권리</h2>
            <p>회원은 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정·삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>회원 탈퇴 (마이페이지 → 내 정보)</li>
            </ul>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">7. 개인정보 보호책임자</h2>
            <p>
              [추후 작성 예정] 개인정보 보호책임자 성명·소속·연락처가 들어갈 영역입니다.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">8. 개인정보처리방침 변경</h2>
            <p>
              본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 시 변경사항의 시행 7일 전부터 공지합니다.
            </p>
          </article>
        </section>

        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <p className="text-[12px] text-text-tertiary">
            본 처리방침은 임시 게시본입니다. 정식 방침은 추후 업데이트될 예정입니다.
            문의:{' '}
            <Link href="/sangdamso" className="text-cta hover:underline">상담소</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
