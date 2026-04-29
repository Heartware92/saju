import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ManageProfilesPage from '@/pages/ManageProfilesPage';

export default function Profile() {
  return (
    <Layout>
      <ProtectedRoute>
        <ManageProfilesPage />
      </ProtectedRoute>
    </Layout>
  );
}
