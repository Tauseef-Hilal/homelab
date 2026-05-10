"use client";

import { HomeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@client/components/ui/progress";
import { cn } from "@client/lib/utils";

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    const p1 = setTimeout(() => setProgress(45), 100);
    const p2 = setTimeout(() => setProgress(75), 600);
    const p3 = setTimeout(() => setProgress(98), 1100);
    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
    };
  }, []);

  return (
    <div
      className={cn(
        "h-screen w-screen flex flex-col items-center justify-center bg-background relative overflow-hidden transition-all duration-1000 ease-in-out",
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-105"
      )}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-float [animation-delay:2s]" />

      <div className="flex flex-col items-center gap-12 z-10">
        {/* Logo Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-3xl animate-pulse group-hover:bg-primary/30 transition-colors" />
          <div className="relative bg-background/80 backdrop-blur-sm border border-primary/10 p-8 rounded-[2.5rem] shadow-2xl animate-breathe">
            <HomeIcon className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col items-center gap-6 w-64">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-foreground/90 ml-[0.2em]">
              HOMELAB
            </h1>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.3em] font-medium">
              Digital Sanctuary
            </p>
          </div>

          <div className="w-full space-y-3">
            <Progress value={progress} className="h-1 bg-primary/5" />
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest animate-pulse">
                System Initializing
              </span>
              <span className="text-[9px] text-muted-foreground/40 font-mono">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-40">
        <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
        <span className="text-[10px] uppercase tracking-[0.4em] font-light">
          Secure Connection Active
        </span>
      </div>
    </div>
  );
}
