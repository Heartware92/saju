import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import MoreFortunePage from '@/pages/MoreFortunePage';
import { MORE_FORTUNE_CONFIGS, type MoreFortuneId } from '@/constants/moreFortunes';

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function Page({ params }: PageProps) {
  const { category } = await params;
  if (!(category in MORE_FORTUNE_CONFIGS)) {
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

// 정적 경로 생성 — 9개 카테고리 프리렌더
export function generateStaticParams() {
  return Object.keys(MORE_FORTUNE_CONFIGS).map((id) => ({ category: id }));
}
