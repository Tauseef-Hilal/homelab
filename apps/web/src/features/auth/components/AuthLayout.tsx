"use client";

import React from "react";

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative flex flex-col min-h-screen w-full items-center justify-center bg-background px-6 overflow-hidden selection:bg-primary/20">
      {/* Animated Glow Background Layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full animate-glow-pulse mix-blend-screen" />
        <div className="absolute top-[30%] -right-[10%] w-[35%] h-[50%] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] rounded-full animate-glow-pulse mix-blend-screen [animation-delay:2s]" />
        <div className="absolute -bottom-[10%] left-[10%] w-[45%] h-[40%] bg-purple-500/5 dark:bg-purple-600/10 blur-[100px] rounded-full animate-glow-pulse mix-blend-screen [animation-delay:4s]" />
      </div>

      <div className="absolute inset-0 bg-grid-black/[0.015] dark:bg-grid-white/[0.02] -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <main className="w-full max-w-[440px] z-10 py-12">
        {children}
      </main>
    </div>
  );
};
