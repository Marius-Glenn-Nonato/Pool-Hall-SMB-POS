"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Dashboard } from "@/components/dashboard";
import { SignIn } from "@/components/sign-in";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <Dashboard />;
}
