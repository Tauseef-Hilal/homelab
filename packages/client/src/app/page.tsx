import { LogoutDialog } from "@client/features/auth/components/LogoutDialog";

export default async function Home() {
  return (
    <main className="p-6 text-lg">
      <p>Homelab: Hello World!</p>
      <LogoutDialog />
    </main>
  );
}
