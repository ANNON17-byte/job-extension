import { create } from 'zustand';
import type { Application, ApplicationStatus, ApplicationFilter } from '../types/application';
import { storageService } from '../services/storage';

interface ApplicationState {
  applications: Application[];
  filter: ApplicationFilter;
  isLoading: boolean;
  selectedApplication: Application | null;

  loadApplications: () => Promise<void>;
  addApplication: (app: Application) => Promise<void>;
  updateStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  setFilter: (filter: Partial<ApplicationFilter>) => void;
  selectApplication: (app: Application | null) => void;
  getFilteredApplications: () => Application[];
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  filter: {
    searchQuery: '',
    status: 'all',
    jobCategory: 'all',
  },
  isLoading: false,
  selectedApplication: null,

  loadApplications: async () => {
    set({ isLoading: true });
    try {
      const applications = await storageService.getApplications();
      set({ applications, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addApplication: async (app) => {
    await storageService.addApplication(app);
    await get().loadApplications();
  },

  updateStatus: async (id, status) => {
    const updates: Partial<Application> = { status };
    if (status === 'applied') {
      updates.dateApplied = new Date().toISOString().split('T')[0];
    }
    await storageService.updateApplication(id, updates);
    await get().loadApplications();
  },

  updateApplication: async (id, updates) => {
    await storageService.updateApplication(id, updates);
    await get().loadApplications();
  },

  deleteApplication: async (id) => {
    await storageService.deleteApplication(id);
    await get().loadApplications();
  },

  setFilter: (newFilter) => {
    set((state) => ({ filter: { ...state.filter, ...newFilter } }));
  },

  selectApplication: (app) => {
    set({ selectedApplication: app });
  },

  getFilteredApplications: () => {
    const { applications, filter } = get();
    return applications.filter((app) => {
      // Search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesCompany = app.company.toLowerCase().includes(query);
        const matchesPosition = app.position.toLowerCase().includes(query);
        const matchesNotes = app.notes?.toLowerCase().includes(query);
        if (!matchesCompany && !matchesPosition && !matchesNotes) {
          return false;
        }
      }

      // Status filter
      if (filter.status && filter.status !== 'all') {
        if (app.status !== filter.status) return false;
      }

      // Category filter
      if (filter.jobCategory && filter.jobCategory !== 'all') {
        if (app.jobCategory !== filter.jobCategory) return false;
      }

      return true;
    });
  },
}));

