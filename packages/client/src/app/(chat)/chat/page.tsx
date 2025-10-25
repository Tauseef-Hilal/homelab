import BackButton from "@client/components/BackButton";
import Header from "@client/components/Header";
import GroupChat from "@client/features/chat/components/GroupChat";
import { cx } from "class-variance-authority";
import { MessageCircleIcon } from "lucide-react";

export default function DrivePage() {
  return (
    <>
      <Header
        className="fixed top-0 w-full bg-white dark:bg-black"
        icon={<MessageCircleIcon />}
        title="Chat"
        showBackBtn
      />
      <main className="h-screen w-full">
        <GroupChat />
      </main>
    </>
  );
}
