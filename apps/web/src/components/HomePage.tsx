"use client";

import { HardDrive, MessageCircleIcon } from "lucide-react";
import useAuthStore from "@client/stores/auth.store";
import HomeLink from "./HomeLink";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col h-screen h-[100svh] items-center justify-center bg-background px-6 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col gap-12 sm:gap-16 md:gap-24">
        {/* Hero Section */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 w-fit shadow-sm">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                Personal Cloud
              </span>
            </div>

            <h1 className="text-6xl md:text-[150px] font-black tracking-[-0.07em] text-foreground leading-[0.8] select-none">
              Welcome back
              {user && (
                <span className="block bg-gradient-to-r from-primary via-primary/90 to-primary/60 bg-clip-text text-transparent pb-4">
                  {user.username}
                </span>
              )}
            </h1>
          </div>

          <p className="text-2xl md:text-4xl text-muted-foreground font-medium leading-tight max-w-3xl tracking-tight opacity-80 dark:opacity-70">
            Your secure digital home for private conversations and seamless file
            management.
          </p>
        </div>


        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 md:gap-10">
          <HomeLink
            link="/chat"
            text="Private Messaging"
            icon={<MessageCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />}
          />

          <HomeLink
            link="/drive"
            text="Cloud Storage"
            icon={<HardDrive className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />}
          />
        </div>
      </div>
    </div>
  );
};


export default HomePage;
