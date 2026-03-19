import Header from "@client/components/Header";
import HomePage from "@client/components/HomePage";
import { HomeIcon } from "lucide-react";

export default async function Home() {
  return (
    <>
      <Header icon={<HomeIcon />} title="Homelab" />
      <main>
        <HomePage />
      </main>
    </>
  );
}
