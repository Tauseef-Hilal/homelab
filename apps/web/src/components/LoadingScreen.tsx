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
        <div className="flex flex-col items-center gap-8 w-72">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold tracking-[-0.04em] text-foreground">
              HOMELAB
            </h1>
            <div className="h-0.5 w-8 bg-primary/40 rounded-full" />
          </div>

          <div className="w-full space-y-4">
            <div className="h-[2px] w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-700 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] animate-pulse opacity-60">
                Initializing Secure Session
              </span>
              <span className="text-xs text-muted-foreground font-mono font-bold opacity-80">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-40">
        <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
        <span className="text-xs uppercase tracking-[0.4em] font-light">
          Secure Connection Active
        </span>
      </div>
    </div>
  );
}
