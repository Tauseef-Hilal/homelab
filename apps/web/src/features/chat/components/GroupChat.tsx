"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useMessaging } from "../hooks/useMessaging";
import { Input } from "@client/components/ui/input";
import { useGetBroadcastMessages } from "../hooks/useGetBroadcastMessages";
import {
  ForkKnifeCrossedIcon,
  Loader2Icon,
  SendHorizonalIcon,
} from "lucide-react";
import { Button } from "@client/components/ui/button";
import MessageView from "./MessageView";
import Paginator from "./Paginator";
import { groupMessages } from "../utils/groupMessages";

const GroupChat: React.FC = () => {
  const { messages: liveMessages, sendMessage, currentUserId } = useMessaging();
  const [message, setMessage] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, status, hasNextPage, fetchNextPage } =
    useGetBroadcastMessages(20);

  const historyMessages = data?.pages.flatMap((page) => page.messages) ?? [];

  const allMessages = useMemo(() => {
    const historyAsc = [...historyMessages].reverse(); // oldest -> newest
    const historyIds = new Set(historyMessages.map((m) => m.id));

    // Filter out live messages that are already in the history (to avoid duplicates on refetch)
    const uniqueLiveMessages = liveMessages.filter((m) => !historyIds.has(m.id));

    return [...historyAsc, ...uniqueLiveMessages];
  }, [historyMessages, liveMessages]);

  const groupedMessages = useMemo(() => {
    return groupMessages(allMessages);
  }, [allMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [allMessages.length]);

  if (status === "pending" && allMessages.length === 0) {
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

  if (status === "error") {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive">
          <ForkKnifeCrossedIcon size={32} />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold">Connection Interrupted</h2>
          <p className="text-sm text-muted-foreground">Unable to reach the messaging hub.</p>
        </div>

        <Button onClick={() => fetchNextPage()} variant="outline" className="rounded-xl px-8">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center bg-background/50">
      <div className="flex flex-col w-full max-w-4xl h-full relative">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-2 px-4 md:px-8 py-8 pb-32 no-scrollbar"
        >
          <Paginator paginate={fetchNextPage} hasMoreData={hasNextPage} />

          {groupedMessages.map((group) => (
            <MessageView key={group[0].id} messages={group} />
          ))}

          <div className="h-4" />
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <form
            noValidate
            className="mx-auto max-w-3xl"
            onSubmit={(e) => {
              e.preventDefault();

              if (!message.trim() || !currentUserId) return;

              sendMessage(message);
              setMessage("");
            }}
          >
            <div className="glass shadow-2xl shadow-primary/5 rounded-[2rem] p-2 flex items-center gap-2 border-border/40">
              <div className="flex-1 px-4">
                <Input
                  type="text"
                  placeholder={currentUserId ? "Type your message..." : "Reconnecting..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base font-medium placeholder:text-muted-foreground/40"
                  disabled={!currentUserId}
                />
              </div>

              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-full bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
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
