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
  const { messages: liveMessages, sendMessage } = useMessaging();
  const [message, setMessage] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, status, hasNextPage, fetchNextPage } =
    useGetBroadcastMessages(20);

  const historyMessages = data?.pages.flatMap((page) => page.messages) ?? [];

  const allMessages = useMemo(() => {
    const historyAsc = [...historyMessages].reverse(); // oldest -> newest

    return [...historyAsc, ...liveMessages];
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
      <div className="h-full flex items-center justify-center">
        <Loader2Icon className="animate-spin" size={36} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <ForkKnifeCrossedIcon />
        <p>Something went wrong</p>

        <Button onClick={() => fetchNextPage()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center">
      <div className="flex flex-col w-full max-w-3xl h-full">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-1 px-2 py-6 pb-28"
        >
          <div className="h-4" />

          <Paginator paginate={fetchNextPage} hasMoreData={hasNextPage} />

          {groupedMessages.map((group) => (
            <MessageView key={group[0].id} messages={group} />
          ))}

          <div className="h-6" />
        </div>

        {/* Input */}
        <form
          noValidate
          className="fixed bottom-0 left-0 w-full flex justify-center p-4"
          onSubmit={(e) => {
            e.preventDefault();

            if (!message.trim()) return;

            sendMessage(message);
            setMessage("");
          }}
        >
          <div className="flex items-center w-full max-w-3xl gap-2 rounded-full border bg-background px-3 py-2 shadow-sm">
            <Input
              type="text"
              placeholder="Write a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <Button
              type="submit"
              size="icon"
              className="rounded-full"
              disabled={!message.trim()}
            >
              <SendHorizonalIcon size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
