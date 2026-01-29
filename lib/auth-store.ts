"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  role: "admin" | "staff";
  createdAt: Date;
}

interface AuthStore {
  users: Array<{ id: string; username: string; passwordHash: string; role: "admin" | "staff"; createdAt: Date }>;
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Auth methods
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (username: string, password: string, role?: "admin" | "staff") => { success: boolean; error?: string };
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; error?: string };
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
      // Default admin user: admin/admin123
      users: [
        {
          id: "user-default",
          username: "admin",
          passwordHash: simpleHash("admin123"),
          role: "admin",
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
          return { success: false, error: "User not found" };
        }

        if (user.passwordHash !== simpleHash(password)) {
          return { success: false, error: "Invalid password" };
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

      register: (username, password, role = "staff") => {
        const { users } = get();

        if (username.length < 3) {
          return { success: false, error: "Username must be at least 3 characters" };
        }

        if (password.length < 6) {
          return { success: false, error: "Password must be at least 6 characters" };
        }

        if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, error: "Username already exists" };
        }

        const newUser = {
          id: `user-${Date.now()}`,
          username,
          passwordHash: simpleHash(password),
          role,
          createdAt: new Date(),
        };

        set((state) => ({
          users: [...state.users, newUser],
        }));

        return { success: true };
      },

      changePassword: (oldPassword, newPassword) => {
        const { currentUser, users } = get();

        if (!currentUser) {
          return { success: false, error: "Not logged in" };
        }

        const user = users.find((u) => u.id === currentUser.id);
        if (!user) {
          return { success: false, error: "User not found" };
        }

        if (user.passwordHash !== simpleHash(oldPassword)) {
          return { success: false, error: "Current password is incorrect" };
        }

        if (newPassword.length < 6) {
          return { success: false, error: "New password must be at least 6 characters" };
        }

        set((state) => ({
          users: state.users.map((u) =>
            u.id === currentUser.id
              ? { ...u, passwordHash: simpleHash(newPassword) }
              : u
          ),
        }));

        return { success: true };
      },
    }),
    {
      name: "pool-hall-auth",
    }
  )
);
