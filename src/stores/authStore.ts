import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Organization } from '@/types/form';

interface AuthStore {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, organization: Organization) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Demo user for testing
const demoUser: User = {
  id: 'demo-user-1',
  email: 'demo@formy.app',
  name: 'Demo User',
  role: 'admin',
  organizationId: 'org-1',
  plan: 'pro',
  createdAt: new Date(),
};

const demoOrganization: Organization = {
  id: 'org-1',
  name: 'Demo Organization',
  slug: 'demo-org',
  plan: 'pro',
  members: 5,
  formsLimit: 50,
  responsesLimit: 5000,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      
      login: (user, organization) => set({ 
        user, 
        organization, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        organization: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'formy-auth',
    }
  )
);

// Helper to login with demo account
export const loginWithDemo = () => {
  useAuthStore.getState().login(demoUser, demoOrganization);
};
