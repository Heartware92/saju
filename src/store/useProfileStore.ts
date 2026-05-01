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

  fetchProfiles: (opts?: { force?: boolean; userId?: string }) => Promise<void>;
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
      const uid = opts?.userId ?? (await auth.getCurrentUser())?.id;
      if (!uid) {
        set({ loading: false });
        return;
      }

      if (cachedForUserId && cachedForUserId !== uid) {
        set({ profiles: [], lastFetchedAt: null, cachedForUserId: null });
      } else if (!opts?.force && fresh && cachedForUserId === uid) {
        return;
      }

      set({ loading: !hasCache, error: null });
      const next = await profileDB.getProfiles(uid);
      set({ profiles: next, loading: false, lastFetchedAt: Date.now(), cachedForUserId: uid });
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
        cachedForUserId: state.cachedForUserId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
