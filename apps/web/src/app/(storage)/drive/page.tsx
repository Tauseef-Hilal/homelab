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
    <>
      <div className="flex flex-col h-screen overflow-clip">
        <Header icon={<HardDrive />} title="Drive" showBackBtn />
        <main className="h-full">
          <Explorer shareToken={shareToken} />
        </main>
      </div>
    </>
  );
}
