"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useMessaging } from "../hooks/useMessaging";
import { Input } from "@client/components/ui/input";
import { useGetBroadcastMessages } from "../hooks/useGetBroadcastMessages";
import { Button } from "@client/components/ui/button";
import {
  SendHorizonalIcon,
  Loader2Icon,
  ForkKnifeCrossedIcon,
} from "lucide-react";
import MessageView from "./MessageView";
import Paginator from "./Paginator";
import useAuthStore from "@client/stores/auth.store";

const GroupChat: React.FC = () => {
  const [message, setMessage] = useState("");
  const { sendMessage, messages: realTimeMessages } = useMessaging();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useGetBroadcastMessages();

  const historyMessages = data?.pages.flatMap((page) => page.messages) ?? [];
  
  const allMessages = useMemo(() => {
    const history = [...historyMessages].reverse();
    const historyIds = new Set(history.map((m) => m.id));
    const uniqueRealTime = realTimeMessages.filter((m) => !historyIds.has(m.id));
    return [...history, ...uniqueRealTime];
  }, [historyMessages, realTimeMessages]);

  const groupedMessages = useMemo(() => {
    const groups: any[][] = [];
    let currentGroup: any[] = [];

    allMessages.forEach((m, i) => {
      const prev = allMessages[i - 1];
      const isSameUser = prev && prev.author.id === m.author.id;
      const isRecent =
        prev &&
        new Date(m.sentAt).getTime() - new Date(prev.sentAt).getTime() <
          1000 * 60 * 5;

      if (isSameUser && isRecent) {
        currentGroup.push(m);
      } else {
        if (currentGroup.length > 0) groups.push(currentGroup);
        currentGroup = [m];
      }
    });

    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }, [allMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage) return;

    el.scrollTop = el.scrollHeight;
  }, [allMessages.length, isFetchingNextPage]);

  if (status === "error") {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive">
          <ForkKnifeCrossedIcon size={32} />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold font-heading">Connection Interrupted</h2>
          <p className="text-base text-muted-foreground">Unable to reach the messaging hub.</p>
        </div>

        <Button onClick={() => fetchNextPage()} variant="outline" className="rounded-xl px-8 h-12">
          Retry Connection
        </Button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2Icon className="animate-spin text-primary" size={24} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          Syncing Sanctuary
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center bg-background/50">
      <div className="flex flex-col w-full max-w-4xl h-full">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col justify-end gap-2 px-4 md:px-8 py-8 no-scrollbar"
        >
          <Paginator paginate={fetchNextPage} hasMoreData={hasNextPage} />

          {groupedMessages.map((group) => (
            <MessageView key={group[0].id} messages={group} />
          ))}

          <div className="h-4 shrink-0" />
        </div>

        {/* Input area */}
        <div className="p-4 md:p-6 shrink-0 z-10">
          <form
            noValidate
            className="mx-auto max-w-3xl"
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim()) {
                sendMessage(message);
                setMessage("");
              }
            }}
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="relative h-14 bg-background/60 backdrop-blur-xl border-white/10 dark:border-white/5 rounded-2xl pr-16 focus:ring-primary/20 transition-all text-base"
              />
              <Button
                size="icon"
                type="submit"
                className="absolute right-2 top-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                disabled={!message.trim() || !currentUserId}
              >
                <SendHorizonalIcon size={20} className="ml-0.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
