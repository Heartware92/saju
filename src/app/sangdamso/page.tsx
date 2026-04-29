import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ConsultationPage from '@/pages/ConsultationPage';

export default function Sangdamso() {
  return (
    <Layout>
      <ProtectedRoute>
        <ConsultationPage />
      </ProtectedRoute>
    </Layout>
  );
}
