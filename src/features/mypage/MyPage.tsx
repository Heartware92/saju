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
  const { balance, transactions, fetchTransactions } = useCreditStore();

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
    router.push('/');
  };

  const tabs: { id: TabType; label: string; icon: string | React.ReactNode }[] = [
    { id: 'profile', label: '프로필', icon: '👤' },
    { id: 'credits', label: '엽전 관리', icon: <img src="/coin.png" alt="" style={{ width: 20, height: 20 }} /> },
    { id: 'records', label: '분석 기록', icon: '📜' },
    { id: 'orders', label: '구매 내역', icon: '🛒' }
  ];

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">마이페이지</h1>
          <p className="text-text-secondary">내 정보와 활동 내역을 확인하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg
                whitespace-nowrap transition-all
                ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-secondary'
                }
              `}
            >
              <span className="text-lg">{typeof tab.icon === 'string' ? tab.icon : tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="space-y-6">
          {activeTab === 'profile' && <ProfileTab user={user} onLogout={handleLogout} />}
          {activeTab === 'credits' && <CreditsTab balance={balance} transactions={transactions} loading={loading} />}
          {activeTab === 'records' && <RecordsTab records={sajuRecords} loading={loading} />}
          {activeTab === 'orders' && <OrdersTab orders={orders} loading={loading} />}
        </div>
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
      <h2 className="text-xl font-bold text-primary mb-6">내 정보</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-text-secondary">이메일</span>
          <span className="font-medium text-text">{user?.email || '-'}</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-text-secondary">가입일</span>
          <span className="font-medium text-text">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-text-secondary">보유 엽전</span>
          <CreditBalance showAddButton={false} size="sm" />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <Button variant="outline" fullWidth onClick={onLogout}>
          로그아웃
        </Button>
      </div>
    </Card>
  );
};

/**
 * 엽전 관리 탭
 */
const CreditsTab: React.FC<{
  balance: number;
  transactions: CreditTransaction[];
  loading: boolean;
}> = ({ balance, transactions, loading }) => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* 잔액 카드 */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">엽전 잔액</h2>
          <Button variant="accent" onClick={() => router.push('/credit')}>
            충전하기
          </Button>
        </div>

        <div className="text-center py-8">
          <div className="mb-4"><img src="/coin.png" alt="엽전" style={{ width: 64, height: 64, margin: '0 auto' }} /></div>
          <div className="text-4xl font-bold text-accent mb-2">{balance}</div>
          <div className="text-text-secondary">보유 엽전</div>
        </div>
      </Card>

      {/* 거래 내역 */}
      <Card>
        <h2 className="text-xl font-bold text-primary mb-6">거래 내역</h2>

        {loading ? (
          <div className="text-center py-8 text-text-secondary">로딩 중...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">거래 내역이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <div className="font-medium text-text">{tx.reason}</div>
                  <div className="text-sm text-text-secondary">
                    {new Date(tx.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${tx.amount > 0 ? 'text-accent' : 'text-fire'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} 엽전
                  </div>
                  <div className="text-sm text-text-secondary">잔액: {tx.balance_after}</div>
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
      <h2 className="text-xl font-bold text-primary mb-6">사주 분석 기록</h2>

      {loading ? (
        <div className="text-center py-8 text-text-secondary">로딩 중...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          아직 분석 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-primary">
                    {new Date(record.birth_date).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {record.gender === 'male' ? '남성' : '여성'}
                    {record.birth_place && ` · ${record.birth_place}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-accent font-bold">
                    {record.is_detailed ? '상세 해석' : '기본 해석'}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {record.credit_used} 엽전
                  </div>
                </div>
              </div>
              <div className="text-sm text-text-secondary">
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
      completed: 'text-accent',
      failed: 'text-fire',
      refunded: 'text-text-secondary'
    };
    return colorMap[status] || 'text-text';
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-primary mb-6">구매 내역</h2>

      {loading ? (
        <div className="text-center py-8 text-text-secondary">로딩 중...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          구매 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-primary mb-1">{order.package_name}</div>
                  <div className="text-sm text-text-secondary">
                    {new Date(order.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className={`font-bold ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-text-secondary">
                  {order.payment_method || '결제 수단'}
                </div>
                <div className="font-bold text-text">
                  {order.amount.toLocaleString()}원
                  <span className="text-accent ml-2">+{order.credit_amount} 엽전</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
