import Header from "@client/components/Header";
import GroupChat from "@client/features/chat/components/GroupChat";
import { MessageCircleIcon } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <Header icon={<MessageCircleIcon />} title="Chat" showBackBtn />

      <main className="flex-1 overflow-hidden">
        <GroupChat />
      </main>
    </div>
  );
}
