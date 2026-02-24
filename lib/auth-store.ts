"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: Date;
}

interface AuthStore {
  users: Array<{ id: string; username: string; passwordHash: string; role: "admin" | "user"; createdAt: Date }>;
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Auth methods
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

// Simple hash function for demo (in production, use bcrypt on server)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Default users: admin/admin123 and user/user123
      users: [
        {
          id: "user-admin",
          username: "admin",
          passwordHash: simpleHash("admin123"),
          role: "admin",
          createdAt: new Date(),
        },
        {
          id: "user-regular",
          username: "user",
          passwordHash: simpleHash("user123"),
          role: "user",
          createdAt: new Date(),
        },
      ],
      currentUser: null,
      isAuthenticated: false,

      login: (username, password) => {
        const { users } = get();
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
          return { success: false, error: "Invalid username or password" };
        }

        if (user.passwordHash !== simpleHash(password)) {
          return { success: false, error: "Invalid username or password" };
        }

        set({
          currentUser: {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
          },
          isAuthenticated: true,
        });

        return { success: true };
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "pool-hall-auth",
      // Only persist currentUser and isAuthenticated, keep users array from initial state
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
