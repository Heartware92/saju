/**
 * 사주 프로필 상태 관리 (Zustand)
 * 가족/친구 등 여러 명의 생년월일 저장
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { profileDB, auth } from '../services/supabase';
import type { BirthProfile } from '../types/credit';

interface ProfileState {
  profiles: BirthProfile[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  lastFetchedAt: number | null;
  cachedForUserId: string | null;  // 캐시가 어떤 유저 기준인지 저장 — 유저가 바뀌면 캐시 무효화

  fetchProfiles: (opts?: { force?: boolean }) => Promise<void>;
  addProfile: (profile: Omit<BirthProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<BirthProfile | null>;
  updateProfile: (id: string, updates: Partial<Omit<BirthProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  setPrimary: (id: string) => Promise<boolean>;
  reset: () => void;
}

const STALE_MS = 60_000;

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      loading: false,
      error: null,
      hydrated: false,
      lastFetchedAt: null,
      cachedForUserId: null,

  fetchProfiles: async (opts) => {
    const { lastFetchedAt, profiles, cachedForUserId } = get();
    const fresh = lastFetchedAt && Date.now() - lastFetchedAt < STALE_MS;
    const hasCache = profiles.length > 0;

    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        // 토큰 갱신 hiccup 등으로 일시적으로 user 가 null 일 수 있음.
        // 기존 캐시 유지하고 다음 호출에 다시 시도. 단 로딩 표시는 끔.
        set({ loading: false });
        return;
      }

      // 캐시가 다른 유저 소속이면 즉시 무효화 (로그인 계정이 바뀐 경우).
      // 다른 유저의 프로필 데이터를 신규 유저에게 보여주는 것을 방지한다.
      if (cachedForUserId && cachedForUserId !== user.id) {
        set({ profiles: [], lastFetchedAt: null, cachedForUserId: null });
      } else if (!opts?.force && fresh && cachedForUserId === user.id) {
        return;
      }

      // 캐시가 있으면 백그라운드 갱신 — 로딩 표시 안 함 (깜빡임 방지)
      set({ loading: !hasCache, error: null });
      const next = await profileDB.getProfiles(user.id);
      set({ profiles: next, loading: false, lastFetchedAt: Date.now(), cachedForUserId: user.id });
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      set({ error: error.message, loading: false });
    }
  },

  addProfile: async (profile) => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const created = await profileDB.createProfile({
        ...profile,
        user_id: user.id,
      });

      set({ profiles: [...get().profiles, created], loading: false });
      return created;
    } catch (error: any) {
      console.error('Error adding profile:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateProfile: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updated = await profileDB.updateProfile(id, updates);
      set({
        profiles: get().profiles.map(p => p.id === id ? updated : p),
        loading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  deleteProfile: async (id) => {
    try {
      set({ loading: true, error: null });
      const target = get().profiles.find(p => p.id === id);
      const wasPrimary = target?.is_primary === true;

      await profileDB.deleteProfile(id);

      let remaining = get().profiles.filter(p => p.id !== id);

      // 삭제된 프로필이 대표였고 남은 프로필이 있다면, 첫 번째를 자동 대표로 승계.
      // 홈 화면이 항상 어떤 대표를 가지도록 보장 — 사용자가 매번 수동 지정할 필요 없게.
      if (wasPrimary && remaining.length > 0 && !remaining.some(p => p.is_primary)) {
        const heir = remaining[0];
        try {
          const user = await auth.getCurrentUser();
          if (user) {
            await profileDB.setPrimaryProfile(user.id, heir.id);
            remaining = remaining.map(p => ({ ...p, is_primary: p.id === heir.id }));
          }
        } catch (e) {
          // 승계 실패해도 삭제는 성공으로 — 사용자가 프로필 관리 페이지에서 수동 지정 가능
          console.error('Auto promote primary after delete failed:', e);
        }
      }

      set({ profiles: remaining, loading: false });
      return true;
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  setPrimary: async (id) => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');

      await profileDB.setPrimaryProfile(user.id, id);
      set({
        profiles: get().profiles.map(p => ({ ...p, is_primary: p.id === id })),
        loading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Error setting primary profile:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  reset: () => {
    set({ profiles: [], loading: false, error: null, lastFetchedAt: null, cachedForUserId: null });
  },
    }),
    {
      name: 'saju-profiles-cache',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profiles: state.profiles,
        lastFetchedAt: state.lastFetchedAt,
        cachedForUserId: state.cachedForUserId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
