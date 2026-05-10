"use client";

import { useEffect, useState } from "react";
import { useAuthInit } from "@client/hooks/useAuthInit";
import useAuthStore from "@client/stores/auth.store";
import { LoadingScreen } from "./LoadingScreen";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authInit = useAuthInit();
  const authInitialized = useAuthStore((s) => s.authInitialized);
  const [minDelayMet, setMinDelayMet] = useState(false);

  useEffect(() => {
    authInit.mutate();
    const timer = setTimeout(() => setMinDelayMet(true), 1200); // 1.2s for good measure
    return () => clearTimeout(timer);
  }, []);

  if (!authInitialized || !minDelayMet) {
    return <LoadingScreen />;
  }

  return children;
}
