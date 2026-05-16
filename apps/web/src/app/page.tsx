import Header from "@client/components/Header";
import HomePage from "@client/components/HomePage";
import { HomeIcon } from "lucide-react";

export default async function Home() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <Header icon={<HomeIcon />} title="Homelab" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <HomePage />
      </main>
    </div>
  );
}
