import Header from "@client/components/Header";
import Explorer from "@client/features/storage/components/Explorer";
import { HardDrive } from "lucide-react";

export default function DrivePage() {
  return (
    <>
      <div className="flex flex-col h-screen overflow-clip">
        <Header icon={<HardDrive />} title="Drive" showBackBtn />
        <main className="h-full">
          <Explorer />
        </main>
      </div>
    </>
  );
}
