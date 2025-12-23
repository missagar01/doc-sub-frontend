import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user' | 'employee';
  email?: string;
  department?: string;
  permissions: string[];
  systemAccess?: string[];
  pageAccess?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      token: null,

      login: async (username: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });

          if (!res.ok) {
            return false;
          }

          const data = await res.json();

          // Map systemAccess from backend to permissions for frontend compatibility
          const permissions = data.user.systemAccess?.map((s: string) =>
            s.charAt(0).toUpperCase() + s.slice(1)
          ) || ['Dashboard', 'Document', 'Subscription'];

          // Add common pages if user has access
          if (data.user.role === 'admin') {
            permissions.push('Master', 'Settings', 'Loan', 'Calendar');
          }

          const user: User = {
            id: String(data.user.id),
            username: data.user.username,
            name: data.user.name,
            role: data.user.role === 'admin' ? 'admin' : 'user',
            email: data.user.email,
            department: data.user.department,
            permissions: Array.from(new Set<string>(permissions)),
            systemAccess: data.user.systemAccess,
            pageAccess: data.user.pageAccess,
          };

          set({
            isAuthenticated: true,
            currentUser: user,
            token: data.token
          });

          return true;
        } catch (err) {
          console.error('Login error:', err);
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false, currentUser: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;