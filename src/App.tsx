/**
 * 메인 App 컴포넌트 - 라우팅 설정
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

// Layout
import Layout from './components/Layout';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import SajuInputPage from './pages/SajuInputPage';
import SajuResultPage from './pages/SajuResultPage';
import TarotPage from './pages/TarotPage';

// Auth
import { LoginPage, SignupPage } from './features/auth';

// Credit
import { CreditPurchasePage } from './features/credit/pages/CreditPurchasePage';

// MyPage
import { MyPage } from './features/mypage/MyPage';

// Stores
import { useUserStore } from './store/useUserStore';

function App() {
  const { initialize } = useUserStore();

  // 앱 초기화 - 인증 상태 확인
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        {/* Auth Routes (Layout 없음) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignupPage />
            </GuestRoute>
          }
        />

        {/* Layout이 있는 Routes */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/saju" element={<SajuInputPage />} />
                <Route path="/saju/result" element={<SajuResultPage />} />
                <Route path="/tarot" element={<TarotPage />} />

                {/* Protected Routes (로그인 필요) */}
                <Route
                  path="/credit"
                  element={
                    <ProtectedRoute>
                      <CreditPurchasePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mypage"
                  element={
                    <ProtectedRoute>
                      <MyPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

/**
 * 404 페이지
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center space-y-6">
        <div className="text-8xl">🔍</div>
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <p className="text-text-secondary text-lg">페이지를 찾을 수 없습니다.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
};

export default App;
