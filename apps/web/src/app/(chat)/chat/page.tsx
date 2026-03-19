import Header from "@client/components/Header";
import GroupChat from "@client/features/chat/components/GroupChat";
import { MessageCircleIcon } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header icon={<MessageCircleIcon />} title="Chat" showBackBtn />

      <main className="flex-1 overflow-hidden">
        <GroupChat />
      </main>
    </div>
  );
}
