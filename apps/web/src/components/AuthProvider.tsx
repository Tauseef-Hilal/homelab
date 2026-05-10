"use client";

import { useEffect } from "react";
import { useAuthInit } from "@client/hooks/useAuthInit";
import useAuthStore from "@client/stores/auth.store";
import { Loader2Icon } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authInit = useAuthInit();
  const authInitialized = useAuthStore((s) => s.authInitialized);

  useEffect(() => {
    authInit.mutate();
  }, []);

  if (!authInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2Icon className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return children;
}
