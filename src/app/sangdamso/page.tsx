import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ConsultationListPage from '@/pages/ConsultationListPage';

export default function Sangdamso() {
  return (
    <Layout>
      <ProtectedRoute>
        <ConsultationListPage />
      </ProtectedRoute>
    </Layout>
  );
}
