import { create } from 'zustand';
import type {
  Profile,
  PersonalInfo,
  Education,
  WorkExperience,
  Project,
  SkillCategories,
} from '../types/profile';
import { storageService } from '../services/storage';
import { seedProfile } from '../data/seed-profile';

interface ProfileState {
  profile: Profile;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => Promise<void>;
  updateEducation: (edu: Partial<Education>) => Promise<void>;
  addExperience: (exp: WorkExperience) => Promise<void>;
  updateExperience: (id: string, exp: Partial<WorkExperience>) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  addProject: (proj: Project) => Promise<void>;
  updateProject: (id: string, proj: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addSkill: (category: keyof SkillCategories, skill: string) => Promise<void>;
  removeSkill: (category: keyof SkillCategories, skill: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: seedProfile,
  isLoading: false,
  isSaving: false,
  error: null,

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await storageService.getProfile();
      set({ profile, isLoading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  updatePersonalInfo: async (info) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      personal: { ...profile.personal, ...info },
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  updateEducation: async (edu) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      education: { ...profile.education, ...edu },
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  addExperience: async (exp) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      experience: [exp, ...profile.experience],
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  updateExperience: async (id, exp) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      experience: profile.experience.map((e) => (e.id === id ? { ...e, ...exp } : e)),
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  deleteExperience: async (id) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      experience: profile.experience.filter((e) => e.id !== id),
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  addProject: async (proj) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      projects: [proj, ...profile.projects],
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  updateProject: async (id, proj) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      projects: profile.projects.map((p) => (p.id === id ? { ...p, ...proj } : p)),
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  deleteProject: async (id) => {
    const { profile } = get();
    const updated: Profile = {
      ...profile,
      projects: profile.projects.filter((p) => p.id !== id),
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  addSkill: async (category, skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const { profile } = get();
    const current = profile.skills[category] || [];
    if (current.includes(trimmed)) return;

    const updated: Profile = {
      ...profile,
      skills: {
        ...profile.skills,
        [category]: [...current, trimmed],
      },
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  removeSkill: async (category, skill) => {
    const { profile } = get();
    const current = profile.skills[category] || [];
    const updated: Profile = {
      ...profile,
      skills: {
        ...profile.skills,
        [category]: current.filter((s) => s !== skill),
      },
    };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },

  resetToSeed: async () => {
    set({ isSaving: true });
    const profile = await storageService.resetToSeed();
    set({ profile, isSaving: false });
  },

  completeOnboarding: async () => {
    const { profile } = get();
    const updated: Profile = { ...profile, onboardingCompleted: true };
    set({ profile: updated });
    await storageService.saveProfile(updated);
  },
}));

