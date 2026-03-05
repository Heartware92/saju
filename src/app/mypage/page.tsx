import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MyPage } from '@/features/mypage/MyPage';

export default function MyPageRoute() {
  return (
    <Layout>
      <ProtectedRoute>
        <MyPage />
      </ProtectedRoute>
    </Layout>
  );
}
