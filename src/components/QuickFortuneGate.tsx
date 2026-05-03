'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { findRecentArchive, type ArchiveCategory } from '../services/archiveService';

export interface QuickFortuneGateProps {
  serviceName: string;
  archiveCategory: ArchiveCategory;
  archiveContext?: { key: string; value: string };
  creditType: 'sun' | 'moon';
  creditCost: number;
}

export function QuickFortuneGate({
  serviceName,
  archiveCategory,
  archiveContext,
  creditType,
  creditCost,
}: QuickFortuneGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();
  const { profiles, fetchProfiles, loading: profilesLoading } = useProfileStore();
  const { sunBalance, moonBalance } = useCreditStore();

  const [initialized, setInitialized] = useState(profiles.length > 0);
  const [checking, setChecking] = useState(true);
  const [archive, setArchive] = useState<{ id: string; created_at: string } | null>(null);
  const [modalType, setModalType] = useState<'credit' | 'existing' | 'insufficient' | null>(null);

  const balance = creditType === 'sun' ? sunBalance : moonBalance;
  const creditLabel = creditType === 'sun' ? '☀️ 해' : '🌙 달';
  const primaryProfile = profiles.find(p => p.is_primary) ?? profiles[0] ?? null;

  useEffect(() => {
    if (user) {
      fetchProfiles().then(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, [user, fetchProfiles]);

  useEffect(() => {
    if (initialized && (!user || profiles.length === 0)) {
      router.replace('/saju/input');
    }
  }, [initialized, profiles, user, router]);

  useEffect(() => {
    if (!initialized || !primaryProfile) return;
    setChecking(true);
    findRecentArchive({
      category: archiveCategory,
      birth_date: primaryProfile.birth_date,
      gender: primaryProfile.gender,
      profile_id: primaryProfile.id,
      context: archiveContext,
    }).then(found => {
      setArchive(found);
      setChecking(false);
    }).catch(() => {
      setChecking(false);
    });
  }, [initialized, primaryProfile, archiveCategory, archiveContext]);

  useEffect(() => {
    if (checking) return;
    if (archive) {
      setModalType('existing');
    } else if (balance < creditCost) {
      setModalType('insufficient');
    } else {
      setModalType('credit');
    }
  }, [checking, archive, balance, creditCost]);

  const navigate = useCallback(
    (extra?: string) => {
      if (!primaryProfile) return;
      router.push(`${pathname}?profileId=${primaryProfile.id}${extra ?? ''}`);
    },
    [pathname, router, primaryProfile],
  );

  const handleViewExisting = useCallback(() => {
    if (archive) navigate(`&recordId=${archive.id}`);
  }, [archive, navigate]);

  const handleNewReading = useCallback(() => {
    if (balance < creditCost) {
      setModalType('insufficient');
      return;
    }
    navigate('&fresh=1');
  }, [balance, creditCost, navigate]);

  const handleConfirmCredit = useCallback(() => {
    navigate('&fresh=1');
  }, [navigate]);

  if (!initialized || checking || (profilesLoading && profiles.length === 0)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!primaryProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => router.back()} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[380px] rounded-2xl bg-[rgba(20,12,38,0.97)] border border-[var(--border-subtle)] p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[rgba(124,92,252,0.18)] border border-cta/40 flex items-center justify-center text-2xl">
          {modalType === 'existing' ? '📜' : modalType === 'insufficient' ? '💳' : creditType === 'sun' ? '☀️' : '🌙'}
        </div>

        <p className="text-[13px] text-text-tertiary mb-3">
          {primaryProfile.name} · {primaryProfile.birth_date.replace(/-/g, '.')} · {primaryProfile.gender === 'male' ? '남' : '여'}
        </p>

        {modalType === 'existing' && (
          <>
            <h3 className="text-[17px] font-bold text-text-primary mb-2">이전 풀이가 있어요</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
              <span className="font-semibold text-text-primary">{primaryProfile.name}</span>님의 {serviceName} 결과가 남아있어요.
            </p>
            <div className="space-y-2.5">
              <button type="button" onClick={handleViewExisting} className="block w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] hover:opacity-90 transition-all">
                기존 결과 보기
              </button>
              <button type="button" onClick={handleNewReading} className="block w-full h-12 rounded-lg border border-cta/40 text-cta font-semibold text-[15px] hover:bg-cta/10 transition-all">
                새로 풀이 받기
                <span className="block text-[12px] font-normal text-text-tertiary mt-0.5">{creditLabel} {creditCost}개 소모</span>
              </button>
            </div>
          </>
        )}

        {modalType === 'credit' && (
          <>
            <h3 className="text-[17px] font-bold text-text-primary mb-2">{serviceName}</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
              <span className="font-semibold text-text-primary">{primaryProfile.name}</span>님의 {serviceName}을 풀이합니다.
              <br />{creditLabel} {creditCost}개가 소모됩니다.
            </p>
            <div className="space-y-2.5">
              <button type="button" onClick={handleConfirmCredit} className="block w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] hover:opacity-90 transition-all">
                풀이 받기
              </button>
              <button type="button" onClick={() => router.back()} className="block w-full h-12 rounded-lg border border-[var(--border-subtle)] text-text-secondary font-medium text-[15px] hover:bg-white/5 transition-all">
                취소
              </button>
            </div>
          </>
        )}

        {modalType === 'insufficient' && (
          <>
            <h3 className="text-[17px] font-bold text-text-primary mb-2">크레딧이 부족해요</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
              {serviceName}에는 {creditLabel} {creditCost}개가 필요해요.
              <br />현재 잔액: {creditLabel} {balance}개
            </p>
            <div className="space-y-2.5">
              <button type="button" onClick={() => router.push('/payment')} className="block w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] hover:opacity-90 transition-all">
                크레딧 충전하기
              </button>
              <button type="button" onClick={() => router.back()} className="block w-full h-12 rounded-lg border border-[var(--border-subtle)] text-text-secondary font-medium text-[15px] hover:bg-white/5 transition-all">
                취소
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
