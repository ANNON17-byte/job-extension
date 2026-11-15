import type { Profile } from '../types/profile';
import type { Application } from '../types/application';
import { ProfileSchema } from '../types/profile';
import { seedProfile } from '../data/seed-profile';

export interface ExtensionSettings {
  geminiApiKey?: string;
  geminiModel?: string;
  enableAiAnswers: boolean;
  highlightFilledFields: boolean;
  autoOpenReviewPanel: boolean;
  theme: 'dark' | 'light' | 'system';
}

const getEnvKey = (): string => {
  try {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
  } catch {
    return '';
  }
};

const getEnvModel = (): string => {
  try {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_MODEL) || 'gemini-1.5-flash';
  } catch {
    return 'gemini-1.5-flash';
  }
};

export const defaultSettings: ExtensionSettings = {
  geminiApiKey: getEnvKey(),
  geminiModel: getEnvModel(),
  enableAiAnswers: true,
  highlightFilledFields: true,
  autoOpenReviewPanel: true,
  theme: 'dark',
};

const STORAGE_KEYS = {
  PROFILE: 'applymate_profile',
  APPLICATIONS: 'applymate_applications',
  SETTINGS: 'applymate_settings',
} as const;

class StorageService {
  private hasChromeStorage(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      !!chrome.storage &&
      !!chrome.storage.local
    );
  }

  async getProfile(): Promise<Profile> {
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEYS.PROFILE, (result) => {
          const data = result[STORAGE_KEYS.PROFILE];
          if (data) {
            const parsed = ProfileSchema.safeParse(data);
            if (parsed.success) {
              resolve(parsed.data);
              return;
            }
          }
          this.saveProfile(seedProfile).then(() => resolve(seedProfile));
        });
      });
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (raw) {
          const parsed = ProfileSchema.safeParse(JSON.parse(raw));
          if (parsed.success) return parsed.data;
        }
      } catch {
        // Fallback to seed
      }
      return { ...seedProfile };
    }
  }

  async saveProfile(profile: Profile): Promise<void> {
    const validated = ProfileSchema.parse(profile);
    const updated = {
      ...validated,
      lastUpdated: new Date().toISOString(),
    };

    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.PROFILE]: updated }, resolve);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    }
  }

  async getApplications(): Promise<Application[]> {
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEYS.APPLICATIONS, (result) => {
          resolve(result[STORAGE_KEYS.APPLICATIONS] || []);
        });
      });
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  }

  async saveApplications(applications: Application[]): Promise<void> {
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: applications }, resolve);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    }
  }

  async addApplication(application: Application): Promise<void> {
    const apps = await this.getApplications();
    const existingIndex = apps.findIndex((a) => a.id === application.id || (a.jobUrl && a.jobUrl === application.jobUrl));
    if (existingIndex >= 0) {
      apps[existingIndex] = { ...apps[existingIndex], ...application };
    } else {
      apps.unshift(application);
    }
    await this.saveApplications(apps);
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
    const apps = await this.getApplications();
    const index = apps.findIndex((a) => a.id === id);
    if (index !== -1) {
      apps[index] = { ...apps[index], ...updates };
      await this.saveApplications(apps);
    }
  }

  async deleteApplication(id: string): Promise<void> {
    const apps = await this.getApplications();
    await this.saveApplications(apps.filter((a) => a.id !== id));
  }

  async getSettings(): Promise<ExtensionSettings> {
    const envApiKey = getEnvKey();
    const envModel = getEnvModel();

    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEYS.SETTINGS, (result) => {
          const stored = result[STORAGE_KEYS.SETTINGS] || {};
          const merged: ExtensionSettings = {
            ...defaultSettings,
            ...stored,
            // If stored key is empty but env key exists, use env key
            geminiApiKey: stored.geminiApiKey || envApiKey,
            geminiModel: stored.geminiModel || envModel,
          };
          resolve(merged);
        });
      });
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const stored = raw ? JSON.parse(raw) : {};
        return {
          ...defaultSettings,
          ...stored,
          geminiApiKey: stored.geminiApiKey || envApiKey,
          geminiModel: stored.geminiModel || envModel,
        };
      } catch {
        return { ...defaultSettings, geminiApiKey: envApiKey, geminiModel: envModel };
      }
    }
  }

  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated }, resolve);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    }
  }

  async resetToSeed(): Promise<Profile> {
    await this.saveProfile(seedProfile);
    return seedProfile;
  }

  async isFirstRun(): Promise<boolean> {
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEYS.PROFILE, (result) => {
          resolve(!result[STORAGE_KEYS.PROFILE]);
        });
      });
    } else {
      return !localStorage.getItem(STORAGE_KEYS.PROFILE);
    }
  }

  async initializeWithSeed(): Promise<Profile> {
    const profile = { ...seedProfile, lastUpdated: new Date().toISOString() };
    await this.saveProfile(profile);
    return profile;
  }
}

export const storageService = new StorageService();
