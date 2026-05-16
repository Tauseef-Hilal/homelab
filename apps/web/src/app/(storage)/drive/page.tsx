import Header from "@client/components/Header";
import Explorer from "@client/features/storage/components/Explorer";
import { HardDrive } from "lucide-react";

export default async function DrivePage({
  searchParams,
}: {
  searchParams: Promise<{ shareToken: string }>;
}) {
  const shareToken = (await searchParams).shareToken;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <Header icon={<HardDrive />} title="Drive" showBackBtn />
      <main className="flex-1 overflow-hidden">
        <Explorer shareToken={shareToken} />
      </main>
    </div>
  );
}
