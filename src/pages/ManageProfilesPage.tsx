'use client';

/**
 * 프로필 관리 페이지 — 대표 지정 / 수정 / 삭제 / 추가
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { CITY_COORDINATES } from '../utils/timeCorrection';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { getCharacterFromStem } from '../lib/character';
import type { BirthProfile } from '../types/credit';

function preloadCharacterImage(profile: BirthProfile) {
  try {
    const result = computeSajuFromProfile(profile);
    if (!result) return;
    const character = getCharacterFromStem(result.pillars.day.gan);
    if (!character?.image) return;
    const img = new window.Image();
    img.src = character.image;
  } catch {}
}

export default function ManageProfilesPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const {
    profiles,
    fetchProfiles,
    deleteProfile,
    setPrimary,
    updateProfile,
    loading,
  } = useProfileStore();

  const [confirmDelete, setConfirmDelete] = useState<BirthProfile | null>(null);
  const [editing, setEditing] = useState<BirthProfile | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    birth_date: string;
    birth_time: string;
    gender: 'male' | 'female';
    calendar_type: 'solar' | 'lunar';
    birth_place: string;
    memo: string;
  } | null>(null);

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">로그인이 필요해요</p>
        <Link
          href="/login?from=/saju/profile"
          className="px-5 py-2.5 rounded-xl bg-cta text-white text-sm font-semibold"
        >
          로그인
        </Link>
      </div>
    );
  }

  const openEdit = (p: BirthProfile) => {
    setEditing(p);
    setEditForm({
      name: p.name,
      birth_date: p.birth_date,
      birth_time: p.birth_time ?? '',
      gender: p.gender,
      calendar_type: p.calendar_type ?? 'solar',
      birth_place: p.birth_place || 'seoul',
      memo: p.memo ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    const longitude = CITY_COORDINATES[editForm.birth_place]?.lng ?? null;
    const ok = await updateProfile(editing.id, {
      name: editForm.name.trim(),
      birth_date: editForm.birth_date,
      birth_time: editForm.birth_time || undefined,
      gender: editForm.gender,
      calendar_type: editForm.calendar_type,
      birth_place: editForm.birth_place,
      longitude,
      memo: editForm.memo.trim() || undefined,
    });
    if (ok) {
      setEditing(null);
      setEditForm(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteProfile(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="px-4 pt-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
          aria-label="뒤로"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          프로필 관리
        </h1>
        <div className="w-9" />
      </div>

      {/* 안내 */}
      <p className="text-[14px] text-text-tertiary mb-3 px-1">
        대표 프로필은 홈 화면에 표시되며, 모든 운세 분석의 기본값으로 사용됩니다.
      </p>

      {/* 프로필 리스트 */}
      {profiles.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center">
          <p className="text-sm text-text-secondary mb-3">아직 등록된 프로필이 없어요</p>
          <Link
            href="/saju/input?mode=profile-only"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-cta text-white text-[15px] font-semibold"
          >
            새 프로필 추가
          </Link>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-3.5 border transition-all ${
                p.is_primary
                  ? 'border-cta/50 bg-[rgba(124,92,252,0.08)]'
                  : 'border-[var(--border-subtle)] bg-[rgba(20,12,38,0.55)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgba(124,92,252,0.12)] flex items-center justify-center text-lg shrink-0">
                  {p.gender === 'male' ? '👨' : '👩'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-primary text-sm">{p.name}</span>
                    {p.is_primary && (
                      <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-cta/20 text-cta font-semibold">
                        대표
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-text-tertiary mt-0.5">
                    {p.birth_date.replace(/-/g, '.')}
                    {p.birth_time ? ` ${p.birth_time}` : ' (시간 모름)'}
                    {' · '}
                    {p.gender === 'male' ? '남' : '여'}
                  </div>
                  {p.memo && (
                    <div className="text-[13px] text-text-tertiary mt-0.5 truncate">{p.memo}</div>
                  )}
                </div>
              </div>

              {/* 액션 */}
              <div className="mt-3 flex items-center gap-1.5">
                {!p.is_primary && (
                  <button
                    onClick={() => { preloadCharacterImage(p); setPrimary(p.id); }}
                    className="flex-1 py-1.5 rounded-lg bg-[rgba(124,92,252,0.14)] border border-cta/30 text-cta text-[14px] font-semibold hover:bg-[rgba(124,92,252,0.22)] active:scale-[0.97] transition-all"
                  >
                    대표로 지정
                  </button>
                )}
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-text-secondary text-[14px] font-medium hover:text-text-primary active:scale-[0.97] transition-all"
                >
                  수정
                </button>
                <button
                  onClick={() => setConfirmDelete(p)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.35)] text-[#F87171] text-[14px] font-medium hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.97] transition-all"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 버튼 */}
      {profiles.length > 0 && (
        <button
          onClick={() => router.push('/saju/input?mode=profile-only')}
          className="w-full rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-cta/40 p-3.5 flex items-center justify-center gap-2 text-text-tertiary hover:text-cta transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-[15px] font-medium">새 프로필 추가</span>
        </button>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4 pb-[calc(16px+64px+env(safe-area-inset-bottom,0px))] sm:pb-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-2xl p-5 bg-[rgba(28,18,50,0.98)] border border-[var(--border-subtle)]"
            >
              <h3 className="text-base font-bold text-text-primary mb-1">프로필을 삭제할까요?</h3>
              <p className="text-[14px] text-text-secondary mb-4">
                <span className="font-semibold">{confirmDelete.name}</span> 님의 프로필이 영구 삭제됩니다.
                {confirmDelete.is_primary && ' 대표 프로필이므로 삭제 후 홈이 비어보일 수 있습니다.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-text-secondary text-[15px] font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-lg bg-[rgba(239,68,68,0.85)] text-white text-[15px] font-semibold active:scale-[0.98]"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 수정 다이얼로그 */}
      <AnimatePresence>
        {editing && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4 pb-[calc(16px+64px+env(safe-area-inset-bottom,0px))] sm:pb-4"
            onClick={() => { setEditing(null); setEditForm(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[380px] rounded-2xl p-5 bg-[rgba(28,18,50,0.98)] border border-[var(--border-subtle)]"
            >
              <h3 className="text-base font-bold text-text-primary mb-4">프로필 수정</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[13px] text-text-tertiary block mb-1">이름</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-sm text-text-primary focus:border-cta/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[13px] text-text-tertiary block mb-1">양력/음력</label>
                  <div className="flex gap-2">
                    {(['solar', 'lunar'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditForm({ ...editForm, calendar_type: c })}
                        className={`flex-1 py-2 rounded-lg text-[15px] font-medium border transition-all ${
                          editForm.calendar_type === c
                            ? 'bg-[rgba(124,92,252,0.14)] border-cta/40 text-cta'
                            : 'bg-[rgba(255,255,255,0.04)] border-[var(--border-subtle)] text-text-secondary'
                        }`}
                      >
                        {c === 'solar' ? '☀️ 양력' : '🌙 음력'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] text-text-tertiary block mb-1">생년월일</label>
                  <input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-sm text-text-primary focus:border-cta/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[13px] text-text-tertiary block mb-1">
                    출생시간 <span className="text-text-tertiary">(모르면 비워두세요)</span>
                  </label>
                  <input
                    type="time"
                    value={editForm.birth_time}
                    onChange={(e) => setEditForm({ ...editForm, birth_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-sm text-text-primary focus:border-cta/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[13px] text-text-tertiary block mb-1">성별</label>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setEditForm({ ...editForm, gender: g })}
                        className={`flex-1 py-2 rounded-lg text-[15px] font-medium border transition-all ${
                          editForm.gender === g
                            ? 'bg-[rgba(124,92,252,0.14)] border-cta/40 text-cta'
                            : 'bg-[rgba(255,255,255,0.04)] border-[var(--border-subtle)] text-text-secondary'
                        }`}
                      >
                        {g === 'male' ? '남자' : '여자'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] text-text-tertiary block mb-1">메모 (선택)</label>
                  <input
                    value={editForm.memo}
                    onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                    placeholder="예: 엄마, 친구 등"
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-sm text-text-primary focus:border-cta/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => { setEditing(null); setEditForm(null); }}
                  className="flex-1 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-text-secondary text-[15px] font-medium"
                >
                  취소
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editForm.name.trim() || !editForm.birth_date}
                  className="flex-1 py-2.5 rounded-lg bg-cta text-white text-[15px] font-semibold disabled:opacity-40 active:scale-[0.98]"
                >
                  저장
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
