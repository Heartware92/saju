import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import MoreFortunePage from '@/pages/MoreFortunePage';
import {
  MORE_FORTUNE_CONFIGS,
  LEGACY_MORE_CATEGORIES,
  isLegacyMoreCategory,
  type MoreFortuneId,
} from '@/constants/moreFortunes';

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function Page({ params }: PageProps) {
  const { category } = await params;
  // 활성 5개 + 비활성 5개(보관함 호환) 모두 허용. 그 외만 notFound.
  // 비활성 카테고리는 MoreFortunePage 내부에서 isArchiveMode 일 때만 렌더(아니면 홈으로 리다이렉트).
  const isActive = category in MORE_FORTUNE_CONFIGS;
  const isLegacy = isLegacyMoreCategory(category);
  if (!isActive && !isLegacy) {
    notFound();
  }
  return (
    <Layout>
      {/*
       * MoreFortunePage 내부에서 useSearchParams 를 사용 (보관함 재생 ?recordId 처리).
       * SSG 프리렌더에서 Suspense 경계 없이 호출되면 빌드가 실패하므로 Suspense 로 감싼다.
       */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <MoreFortunePage category={category as MoreFortuneId} />
      </Suspense>
    </Layout>
  );
}

// 정적 경로 생성 — 활성 카테고리 + 비활성(보관함 호환) 모두 프리렌더
export function generateStaticParams() {
  return [
    ...Object.keys(MORE_FORTUNE_CONFIGS),
    ...LEGACY_MORE_CATEGORIES,
  ].map((id) => ({ category: id }));
}
