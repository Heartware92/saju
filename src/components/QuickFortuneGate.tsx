'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { findRecentArchive, findArchiveList, type ArchiveCategory } from '../services/archiveService';

export interface QuickFortuneGateProps {
  serviceName: string;
  archiveCategory: ArchiveCategory;
  archiveContext?: { key: string; value: string };
  creditType: 'sun' | 'moon';
  creditCost: number;
  /** 확인 후 이동할 경로 (미지정 시 현재 pathname 사용) */
  targetPath?: string;
  /** 모달 닫기 콜백 (미지정 시 router.back) */
  onClose?: () => void;
}

export function QuickFortuneGate({
  serviceName,
  archiveCategory,
  archiveContext,
  creditType,
  creditCost,
  targetPath,
  onClose,
}: QuickFortuneGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const { sunBalance, moonBalance } = useCreditStore();

  const [initialized, setInitialized] = useState(profiles.length > 0);
  const [checking, setChecking] = useState(true);
  const [archive, setArchive] = useState<{ id: string; created_at: string } | null>(null);
  const [archiveList, setArchiveList] = useState<{ id: string; created_at: string; context_date?: string }[]>([]);
  const [modalType, setModalType] = useState<'credit' | 'existing' | 'date-list' | 'insufficient' | null>(null);

  const balance = creditType === 'sun' ? sunBalance : moonBalance;
  const creditLabel = creditType === 'sun' ? '☀️ 해' : '🌙 달';
  const primaryProfile = profiles.find(p => p.is_primary) ?? profiles[0] ?? null;
  const navPath = targetPath ?? pathname;

  const contextKey = useMemo(
    () => (archiveContext ? `${archiveContext.key}:${archiveContext.value}` : ''),
    [archiveContext],
  );

  useEffect(() => {
    if (user) {
      fetchProfiles().then(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, [user, fetchProfiles]);

  useEffect(() => {
    if (initialized && (!user || profiles.length === 0)) {
      if (onClose) {
        onClose();
      } else {
        router.replace('/saju/input');
      }
    }
  }, [initialized, profiles, user, router, onClose]);

  const isDateList = archiveCategory === 'period' && !archiveContext;

  useEffect(() => {
    if (!initialized || !primaryProfile) return;
    let cancelled = false;
    setChecking(true);

    if (isDateList) {
      findArchiveList({
        category: archiveCategory,
        birth_date: primaryProfile.birth_date,
        gender: primaryProfile.gender,
        profile_id: primaryProfile.id,
      }).then(list => {
        if (!cancelled) {
          setArchiveList(list);
          setChecking(false);
        }
      }).catch(() => {
        if (!cancelled) setChecking(false);
      });
    } else {
      findRecentArchive({
        category: archiveCategory,
        birth_date: primaryProfile.birth_date,
        gender: primaryProfile.gender,
        profile_id: primaryProfile.id,
        context: archiveContext,
      }).then(found => {
        if (!cancelled) {
          setArchive(found);
          setChecking(false);
        }
      }).catch(() => {
        if (!cancelled) setChecking(false);
      });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, primaryProfile?.id, archiveCategory, contextKey, isDateList]);

  useEffect(() => {
    if (checking) return;
    if (isDateList && archiveList.length > 0) {
      setModalType('date-list');
    } else if (archive) {
      setModalType('existing');
    } else if (balance < creditCost) {
      setModalType('insufficient');
    } else {
      setModalType('credit');
    }
  }, [checking, archive, archiveList, balance, creditCost, isDateList]);

  const navigate = useCallback(
    (extra?: string) => {
      if (!primaryProfile) return;
      router.push(`${navPath}?profileId=${primaryProfile.id}${extra ?? ''}`);
    },
    [navPath, router, primaryProfile],
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

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  if (!initialized && !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-[380px] rounded-2xl bg-[rgba(20,12,38,0.97)] border border-[var(--border-subtle)] p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {checking ? (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="py-6 flex flex-col items-center gap-3"
            >
              <div className="w-10 h-10 border-3 border-cta border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-tertiary">확인 중...</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[rgba(124,92,252,0.18)] border border-cta/40 flex items-center justify-center text-2xl">
                {modalType === 'date-list' ? '📅' : modalType === 'existing' ? '📜' : modalType === 'insufficient' ? '💳' : creditType === 'sun' ? '☀️' : '🌙'}
              </div>

              {primaryProfile && (
                <p className="text-[13px] text-text-tertiary mb-3">
                  {primaryProfile.name} · {primaryProfile.birth_date.replace(/-/g, '.')} · {primaryProfile.gender === 'male' ? '남' : '여'}
                </p>
              )}

              {modalType === 'existing' && (
                <>
                  <h3 className="text-[17px] font-bold text-text-primary mb-2">이전 풀이가 있어요</h3>
                  <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
                    <span className="font-semibold text-text-primary">{primaryProfile?.name}</span>님의 {serviceName} 결과가 남아있어요.
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

              {modalType === 'date-list' && (
                <>
                  <h3 className="text-[17px] font-bold text-text-primary mb-2">이전에 본 날짜가 있어요</h3>
                  <p className="text-[14px] text-text-secondary leading-relaxed mb-3">
                    다시 보고 싶은 날짜를 선택하세요.
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1.5 mb-4 px-1">
                    {archiveList.map(item => {
                      const dateLabel = item.context_date
                        ? item.context_date.replace(/-/g, '.')
                        : new Date(item.created_at).toLocaleDateString('ko-KR');
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigate(`&recordId=${item.id}`)}
                          className="w-full h-10 rounded-lg border border-[var(--border-subtle)] text-[14px] text-text-primary font-medium hover:bg-cta/10 hover:border-cta/40 transition-all flex items-center justify-center gap-2"
                        >
                          <span>{dateLabel}</span>
                          <span className="text-[12px] text-text-tertiary">결과 보기</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-2.5">
                    <button type="button" onClick={handleNewReading} className="block w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] hover:opacity-90 transition-all">
                      새 날짜로 풀이 받기
                      <span className="block text-[12px] font-normal text-white/70 mt-0.5">{creditLabel} {creditCost}개 소모</span>
                    </button>
                    <button type="button" onClick={handleClose} className="block w-full h-12 rounded-lg border border-[var(--border-subtle)] text-text-secondary font-medium text-[15px] hover:bg-white/5 transition-all">
                      취소
                    </button>
                  </div>
                </>
              )}

              {modalType === 'credit' && (
                <>
                  <h3 className="text-[17px] font-bold text-text-primary mb-2">{serviceName}</h3>
                  <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
                    <span className="font-semibold text-text-primary">{primaryProfile?.name}</span>님의 {serviceName}을 풀이합니다.
                    <br />{creditLabel} {creditCost}개가 소모됩니다.
                  </p>
                  <div className="space-y-2.5">
                    <button type="button" onClick={handleConfirmCredit} className="block w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] hover:opacity-90 transition-all">
                      풀이 받기
                    </button>
                    <button type="button" onClick={handleClose} className="block w-full h-12 rounded-lg border border-[var(--border-subtle)] text-text-secondary font-medium text-[15px] hover:bg-white/5 transition-all">
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
                    <button type="button" onClick={handleClose} className="block w-full h-12 rounded-lg border border-[var(--border-subtle)] text-text-secondary font-medium text-[15px] hover:bg-white/5 transition-all">
                      취소
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
