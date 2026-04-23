'use client';

/**
 * 마이페이지
 * - 프로필
 * - 크레딧 잔액 & 거래내역
 * - 사주/타로 분석 기록
 * - 구매 내역
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useCreditStore } from '@/store/useCreditStore';
import { orderDB, sajuDB } from '@/services/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditBalance } from '@/features/credit/components/CreditBalance';
import type { Order, SajuRecord, CreditTransaction } from '@/types/credit';

type TabType = 'profile' | 'credits' | 'records' | 'orders';

export const MyPage: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useUserStore();
  const { sunBalance, moonBalance, transactions, fetchTransactions } = useCreditStore();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sajuRecords, setSajuRecords] = useState<SajuRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'credits') {
        await fetchTransactions();
      } else if (activeTab === 'orders') {
        const orderList = await orderDB.getOrders(user.id);
        setOrders(orderList);
      } else if (activeTab === 'records') {
        const records = await sajuDB.getRecords(user.id);
        setSajuRecords(records);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    // replace — 로그아웃 후 뒤로가기로 마이페이지(인증 상태) 돌아가면 안 되므로
    router.replace('/');
  };

  const tabs: { id: TabType; label: string; icon: string | React.ReactNode }[] = [
    { id: 'profile', label: '프로필', icon: '👤' },
    { id: 'credits', label: '크레딧 관리', icon: '☀️' },
    { id: 'records', label: '분석 기록', icon: '📜' },
    { id: 'orders', label: '구매 내역', icon: '🛒' }
  ];

  return (
    <div className="min-h-screen bg-space-deep px-4 pt-4 pb-8">
        {/* 헤더 */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-text-primary mb-1">내 정보</h1>
          <p className="text-sm text-text-secondary">내 정보와 활동 내역을 확인하세요</p>
        </div>

        {/* 탭 네비게이션 — 좁은 화면에서 가로 스크롤 가능하되 스크롤바는 숨김 */}
        <div className="flex gap-1 mb-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-space-surface rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg
                whitespace-nowrap transition-all text-xs font-medium
                ${
                  activeTab === tab.id
                    ? 'bg-cta text-white shadow-md shadow-cta/20'
                    : 'text-text-tertiary'
                }
              `}
            >
              <span className="text-sm">{typeof tab.icon === 'string' ? tab.icon : tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="space-y-6">
          {activeTab === 'profile' && <ProfileTab user={user} onLogout={handleLogout} />}
          {activeTab === 'credits' && <CreditsTab sunBalance={sunBalance} moonBalance={moonBalance} transactions={transactions} loading={loading} />}
          {activeTab === 'records' && <RecordsTab records={sajuRecords} loading={loading} />}
          {activeTab === 'orders' && <OrdersTab orders={orders} loading={loading} />}
        </div>
    </div>
  );
};

/**
 * 프로필 탭
 */
const ProfileTab: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-5">내 정보</h2>

      <div className="space-y-0">
        <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
          <span className="text-text-secondary text-sm">이메일</span>
          <span className="font-medium text-text-primary text-sm">{user?.email || '-'}</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
          <span className="text-text-secondary text-sm">가입일</span>
          <span className="font-medium text-text-primary text-sm">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-text-secondary text-sm">보유 크레딧</span>
          <CreditBalance showAddButton={false} size="sm" />
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
        <Button variant="outline" fullWidth onClick={onLogout}>
          로그아웃
        </Button>
      </div>
    </Card>
  );
};

/**
 * 크레딧 관리 탭
 */
const CreditsTab: React.FC<{
  sunBalance: number;
  moonBalance: number;
  transactions: CreditTransaction[];
  loading: boolean;
}> = ({ sunBalance, moonBalance, transactions, loading }) => {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* 잔액 카드 */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">크레딧 잔액</h2>
          <Button variant="sun" onClick={() => router.push('/credit')}>
            충전하기
          </Button>
        </div>

        <div className="flex justify-center gap-8 py-6">
          <div className="text-center">
            <div className="text-3xl mb-2">☀️</div>
            <div className="text-3xl font-bold text-sun-core mb-1">{sunBalance}</div>
            <div className="text-text-secondary text-xs">해 크레딧</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🌙</div>
            <div className="text-3xl font-bold text-moon-halo mb-1">{moonBalance}</div>
            <div className="text-text-secondary text-xs">달 크레딧</div>
          </div>
        </div>
      </Card>

      {/* 거래 내역 */}
      <Card>
        <h2 className="text-lg font-bold text-text-primary mb-4">거래 내역</h2>

        {loading ? (
          <div className="text-center py-6 text-text-secondary text-sm">로딩 중...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6 text-text-secondary text-sm">거래 내역이 없습니다.</div>
        ) : (
          <div className="space-y-0">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
                <div>
                  <div className="font-medium text-text-primary text-sm">{tx.reason}</div>
                  <div className="text-xs text-text-tertiary">
                    {new Date(tx.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${tx.amount > 0 ? 'text-sun-core' : 'text-fire-core'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} 크레딧
                  </div>
                  <div className="text-xs text-text-tertiary">잔액: {tx.balance_after}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/**
 * 분석 기록 탭
 */
const RecordsTab: React.FC<{ records: SajuRecord[]; loading: boolean }> = ({ records, loading }) => {
  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-4">사주 분석 기록</h2>

      {loading ? (
        <div className="text-center py-6 text-text-secondary text-sm">로딩 중...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-6 text-text-secondary text-sm">
          아직 분석 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="border border-[var(--border-subtle)] rounded-xl p-3.5 hover:border-[var(--border-default)] transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-text-primary text-sm">
                    {new Date(record.birth_date).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {record.gender === 'male' ? '남성' : '여성'}
                    {record.birth_place && ` · ${record.birth_place}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-cta font-bold">
                    {record.is_detailed ? '상세 해석' : '기본 해석'}
                  </div>
                  <div className="text-[13px] text-text-tertiary">
                    {record.credit_used} 크레딧
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-tertiary">
                {new Date(record.created_at).toLocaleString('ko-KR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/**
 * 구매 내역 탭
 */
const OrdersTab: React.FC<{ orders: Order[]; loading: boolean }> = ({ orders, loading }) => {
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '대기중',
      completed: '완료',
      failed: '실패',
      refunded: '환불'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'text-text-secondary',
      completed: 'text-sun-core',
      failed: 'text-fire-core',
      refunded: 'text-text-secondary'
    };
    return colorMap[status] || 'text-text';
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-4">구매 내역</h2>

      {loading ? (
        <div className="text-center py-6 text-text-secondary text-sm">로딩 중...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-6 text-text-secondary text-sm">
          구매 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border border-[var(--border-subtle)] rounded-xl p-3.5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-text-primary text-sm mb-0.5">{order.package_name}</div>
                  <div className="text-xs text-text-tertiary">
                    {new Date(order.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className={`font-bold text-xs ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="text-text-tertiary">
                  {order.payment_method || '결제 수단'}
                </div>
                <div className="font-bold text-text-primary">
                  {order.amount.toLocaleString()}원
                  {order.sun_credit_amount > 0 && <span className="text-sun-core ml-2">+{order.sun_credit_amount} ☀️</span>}
                  {order.moon_credit_amount > 0 && <span className="text-moon-halo ml-2">+{order.moon_credit_amount} 🌙</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
