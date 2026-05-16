"use client";

import { HardDrive, MessageCircleIcon, SparklesIcon } from "lucide-react";
import useAuthStore from "@client/stores/auth.store";
import HomeLink from "./HomeLink";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="relative flex flex-col h-full bg-background px-6 sm:px-10 py-8 sm:py-12 overflow-x-hidden selection:bg-primary/20">
      {/* Animated Glow Background Layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-glow-pulse mix-blend-screen" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-blue-500/10 dark:bg-blue-600/20 blur-[150px] rounded-full animate-glow-pulse mix-blend-screen [animation-delay:2s]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] bg-purple-500/10 dark:bg-purple-600/20 blur-[120px] rounded-full animate-glow-pulse mix-blend-screen [animation-delay:4s]" />
      </div>

      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.03] -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      
      <div className="w-full max-w-5xl flex flex-col gap-6 sm:gap-10 md:gap-12 z-10 mx-auto mt-2 sm:mt-8 mb-auto">
        {/* Hero Section */}
        <div className="flex flex-col gap-4 sm:gap-6 md:gap-7 items-start text-left">
          {/* Badge */}
          <div className="opacity-0 animate-fade-in-up [animation-delay:0.1s] flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-background/50 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-sm">
            <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-[10px] sm:text-xs font-bold text-foreground/80 tracking-widest uppercase">
              Homelab Core System
            </span>
          </div>

          {/* Typography */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="opacity-0 animate-fade-in-up [animation-delay:0.2s] text-[3rem] sm:text-6xl md:text-[5.5rem] font-bold text-foreground tracking-tight leading-[0.9] sm:leading-[0.95]">
              Welcome back, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/80 to-blue-600/80">
                {user?.username || "Commander"}.
              </span>
            </h1>

            <p className="opacity-0 animate-fade-in-up [animation-delay:0.3s] text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-tight">
              Experience high-performance cloud storage and real-time global messaging in one unified platform.
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
          <div className="opacity-0 animate-fade-in-up [animation-delay:0.4s]">
            <HomeLink
              link="/chat"
              text="Global Chat"
              description="Connect and communicate instantly"
              icon={<MessageCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />}
            />
          </div>

          <div className="opacity-0 animate-fade-in-up [animation-delay:0.5s]">
            <HomeLink
              link="/drive"
              text="Cloud Storage"
              description="Securely manage your digital assets"
              icon={<HardDrive className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />}
            />
          </div>
        </div>
      </div>

      {/* Bottom Status Badge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in-up [animation-delay:0.6s] pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/30 backdrop-blur-md border border-white/5 dark:border-white/5 shadow-sm whitespace-nowrap">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/80 uppercase tracking-widest">
            All Systems Operational
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
