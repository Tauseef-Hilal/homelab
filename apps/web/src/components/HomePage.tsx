"use client";

import { HardDrive, MessageCircleIcon } from "lucide-react";
import useAuthStore from "@client/stores/auth.store";
import HomeLink from "./HomeLink";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-10">
      {/* Welcome */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back
          {user && <span className="font-bold">, {user.username}</span>} 👋
        </h1>

        <p className="text-sm text-muted-foreground">
          Access your conversations or manage your files from here.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <HomeLink
          link="/chat"
          text="Chat with people"
          icon={<MessageCircleIcon size={22} />}
        />

        <HomeLink
          link="/drive"
          text="Explore drive"
          icon={<HardDrive size={22} />}
        />
      </div>

      {/* Footer hint */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Tip: Use the Drive to organize files and the Chat to collaborate in real
        time.
      </div>
    </div>
  );
};

export default HomePage;
