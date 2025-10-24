import HomePage from "@client/components/HomePage";
import { LogoutDialog } from "@client/features/auth/components/LogoutDialog";
import { HomeIcon } from "lucide-react";

export default async function Home() {
  return (
    <>
      <header>
        <nav className="flex justify-between border-b-1 p-4">
          <p className="text-xl font-bold flex items-center gap-2">
            <HomeIcon /> Homelab
          </p>
          <LogoutDialog />
        </nav>
      </header>
      <main>
        <HomePage />
      </main>
    </>
  );
}
