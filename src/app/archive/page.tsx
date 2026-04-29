import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ArchivePage from '@/pages/ArchivePage';

export default function Archive() {
  return (
    <Layout>
      <ProtectedRoute>
        <ArchivePage />
      </ProtectedRoute>
    </Layout>
  );
}
