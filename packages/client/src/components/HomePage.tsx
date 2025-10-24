"use client";

import { HardDrive, MessageCircleIcon } from "lucide-react";
import useAuthStore from "@client/features/auth/stores/auth.store";
import HomeLink from "./HomeLink";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-4">
      <h1 className="text-xl">
        Welcome back
        {user && <span className="font-bold">, {user.username}</span>}!
      </h1>
      <div className="flex flex-col">
        <HomeLink
          link="/chat"
          text="Chat with people"
          icon={<MessageCircleIcon />}
        />
        <HomeLink link="/drive" text="Explore drive" icon={<HardDrive />} />
      </div>
    </div>
  );
};

export default HomePage;
