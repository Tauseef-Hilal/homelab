"use client";

import { useEffect } from "react";
import { useAuthInit } from "@client/hooks/useAuthInit";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authInit = useAuthInit();

  useEffect(() => {
    authInit.mutate();
  }, []);

  return children;
}
