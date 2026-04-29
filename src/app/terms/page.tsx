/**
 * 이용약관 페이지 — 껍데기.
 * 회원가입 시 (보기) 링크가 깨지지 않도록 우선 placeholder.
 * 실제 약관 내용은 추후 채울 예정.
 */

import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

export const metadata = {
  title: '이용약관 — 사주이천점',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 pt-4 pb-12 max-w-[720px] mx-auto">
      {/* 헤더 — 좌측 뒤로가기 + 중앙 타이틀 */}
      <div className="flex items-center justify-between mb-6 px-1">
        <BackButton />
        <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          이용약관
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
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제1조 (목적)</h2>
            <p>
              본 약관은 사주이천점(이하 "회사")이 운영하는 사주명리 서비스(이하 "서비스")의 이용과
              관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
              목적으로 합니다.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제2조 (정의)</h2>
            <p>
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>"서비스"란 회사가 제공하는 정통사주, 신년운세, 궁합, 토정비결, 자미두수, 타로 등 모든 명리 풀이 콘텐츠를 의미합니다.</li>
              <li>"회원"이란 본 약관에 동의하고 회사와 서비스 이용 계약을 체결한 자를 말합니다.</li>
              <li>"크레딧"이란 서비스 이용을 위한 가상 화폐로, 해(태양) 크레딧과 달(月) 크레딧을 포함합니다.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제3조 (약관의 효력 및 변경)</h2>
            <p>
              [추후 작성 예정] 약관 게시·변경 통지·동의 등 절차에 관한 조항이 들어갈 영역입니다.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제4조 (서비스의 제공)</h2>
            <p>
              [추후 작성 예정] 제공 범위, 운영 시간, 일시 중단 등에 관한 조항.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제5조 (회원의 의무)</h2>
            <p>
              [추후 작성 예정] 회원이 지켜야 할 의무, 금지 행위 등.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제6조 (회사의 의무)</h2>
            <p>
              [추후 작성 예정] 개인정보 보호, 안정적 서비스 제공 등.
            </p>
          </article>

          <article>
            <h2 className="text-[16px] font-bold text-text-primary mb-2">제7조 (해석 및 관할 법원)</h2>
            <p>
              본 약관에 명시되지 않은 사항은 관계 법령 및 상관례에 따릅니다.
              본 약관과 관련된 분쟁은 회사 본점 소재지 관할 법원을 1심 법원으로 합니다.
            </p>
          </article>
        </section>

        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <p className="text-[12px] text-text-tertiary">
            본 약관은 임시 게시본입니다. 정식 약관은 추후 업데이트될 예정입니다.
            이 페이지에 대한 문의:{' '}
            <Link href="/sangdamso" className="text-cta hover:underline">상담소</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
