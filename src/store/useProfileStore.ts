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

  fetchProfiles: async (opts) => {
    const { lastFetchedAt, profiles } = get();
    const fresh = lastFetchedAt && Date.now() - lastFetchedAt < STALE_MS;
    const hasCache = profiles.length > 0;
    if (!opts?.force && fresh) return;

    try {
      // 캐시가 있으면 백그라운드 갱신 — 로딩 표시 안 함 (깜빡임 방지)
      set({ loading: !hasCache, error: null });
      const user = await auth.getCurrentUser();
      if (!user) {
        set({ profiles: [], loading: false, lastFetchedAt: Date.now() });
        return;
      }
      const next = await profileDB.getProfiles(user.id);
      set({ profiles: next, loading: false, lastFetchedAt: Date.now() });
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
      await profileDB.deleteProfile(id);
      set({
        profiles: get().profiles.filter(p => p.id !== id),
        loading: false,
      });
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
    set({ profiles: [], loading: false, error: null, lastFetchedAt: null });
  },
    }),
    {
      name: 'saju-profiles-cache',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profiles: state.profiles,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
