import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CORRECT_PASSWORD = "Godisgood@1";
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface AuthStore {
  isAuthenticated: boolean;
  lastAuthTime: number | null;
  authenticate: (password: string) => boolean;
  logout: () => void;
  isSessionValid: () => boolean;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      lastAuthTime: null,

      authenticate: (password: string) => {
        if (password === CORRECT_PASSWORD) {
          const now = Date.now();
          set({
            isAuthenticated: true,
            lastAuthTime: now,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          lastAuthTime: null,
        });
      },

      isSessionValid: () => {
        const state = get();
        if (!state.isAuthenticated || !state.lastAuthTime) {
          return false;
        }

        const now = Date.now();
        const elapsed = now - state.lastAuthTime;

        if (elapsed > SESSION_DURATION) {
          set({
            isAuthenticated: false,
            lastAuthTime: null,
          });
          return false;
        }

        return true;
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
