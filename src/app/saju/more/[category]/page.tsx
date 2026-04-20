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
      <MoreFortunePage category={category as MoreFortuneId} />
    </Layout>
  );
}

// 정적 경로 생성 — 9개 카테고리 프리렌더
export function generateStaticParams() {
  return Object.keys(MORE_FORTUNE_CONFIGS).map((id) => ({ category: id }));
}
