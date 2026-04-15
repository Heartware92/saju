/**
 * 사주 프로필 상태 관리 (Zustand)
 * 가족/친구 등 여러 명의 생년월일 저장
 */

import { create } from 'zustand';
import { profileDB, auth } from '../services/supabase';
import type { BirthProfile } from '../types/credit';

interface ProfileState {
  profiles: BirthProfile[];
  loading: boolean;
  error: string | null;

  fetchProfiles: () => Promise<void>;
  addProfile: (profile: Omit<BirthProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<BirthProfile | null>;
  updateProfile: (id: string, updates: Partial<Omit<BirthProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  setPrimary: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  loading: false,
  error: null,

  fetchProfiles: async () => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();
      if (!user) {
        set({ profiles: [], loading: false });
        return;
      }
      const profiles = await profileDB.getProfiles(user.id);
      set({ profiles, loading: false });
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
    set({ profiles: [], loading: false, error: null });
  },
}));
