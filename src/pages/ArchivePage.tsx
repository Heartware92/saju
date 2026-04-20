'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';

type TabType = 'saju' | 'tarot';

const MOCK_SAJU_RECORDS = [
  {
    id: '1',
    type: 'traditional' as const,
    title: '정통 사주',
    date: '2026-04-10',
    summary: '임신년 기유월 계사일',
  },
];

const MOCK_TAROT_RECORDS = [
  {
    id: '1',
    cardName: '태양',
    cardNameEn: 'The Sun',
    isReversed: false,
    date: '2026-04-09',
  },
];

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState<TabType>('saju');

  return (
    <div className="min-h-screen bg-space-deep px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">보관함</h1>
        <p className="text-sm text-text-secondary mt-1">이전에 진행한 상담 기록</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('saju')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'saju'
              ? 'bg-cta text-white shadow-lg shadow-cta/20'
              : 'bg-space-surface text-text-secondary'
          }`}
        >
          사주 기록
        </button>
        <button
          onClick={() => setActiveTab('tarot')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'tarot'
              ? 'bg-cta text-white shadow-lg shadow-cta/20'
              : 'bg-space-surface text-text-secondary'
          }`}
        >
          타로 기록
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'saju' && (
          <div className="space-y-3">
            {MOCK_SAJU_RECORDS.length > 0 ? (
              MOCK_SAJU_RECORDS.map((record) => (
                <Card key={record.id} padding="md" hover>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full bg-cta" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary">{record.title}</h3>
                      <p className="text-xs text-text-tertiary mt-0.5">{record.summary}</p>
                    </div>
                    <span className="text-xs text-text-tertiary">{record.date}</span>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState type="saju" />
            )}
          </div>
        )}

        {activeTab === 'tarot' && (
          <div className="space-y-3">
            {MOCK_TAROT_RECORDS.length > 0 ? (
              MOCK_TAROT_RECORDS.map((record) => (
                <Card key={record.id} padding="md" hover>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(165,180,252,0.12)] flex items-center justify-center text-lg">
                      🎴
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {record.cardName} ({record.cardNameEn})
                      </h3>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {record.isReversed ? '역방향' : '정방향'}
                      </p>
                    </div>
                    <span className="text-xs text-text-tertiary">{record.date}</span>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState type="tarot" />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EmptyState({ type }: { type: 'saju' | 'tarot' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-space-surface flex items-center justify-center text-sm font-bold text-text-tertiary mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
        {type === 'saju' ? '사주' : '타로'}
      </div>
      <p className="text-text-secondary text-sm mb-1">
        {type === 'saju' ? '사주 상담 기록이 없습니다' : '타로 상담 기록이 없습니다'}
      </p>
      <p className="text-text-tertiary text-xs">
        상담을 진행하면 여기에 기록됩니다
      </p>
    </div>
  );
}
