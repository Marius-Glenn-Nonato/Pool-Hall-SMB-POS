"use client";

import { useAuthStore } from "@/lib/auth-store";
import { Dashboard } from "@/components/dashboard";
import { SignIn } from "@/components/sign-in";

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <Dashboard />;
}
