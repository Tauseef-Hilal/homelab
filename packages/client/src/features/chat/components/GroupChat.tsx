"use client";

import { useState } from "react";
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

const GroupChat: React.FC = () => {
  const { messages, sendMessage } = useMessaging();
  const [message, setMessage] = useState("");

  const { data, status, hasNextPage, fetchNextPage } =
    useGetBroadcastMessages(20);

  if (status == "pending" && messages.length == 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2Icon className="animate-spin" size={36} />
      </div>
    );
  }

  if (status == "error") {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <ForkKnifeCrossedIcon />
        <p>Something went wrong</p>
        <Button onClick={() => fetchNextPage()} variant={"outline"}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center">

      <div className="flex flex-col w-full max-w-3xl h-full">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-4 px-4 py-6 pb-28">

          <div className="h-4" />

          {/* New messages */}
          {messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))}

          {/* History */}
          {data?.pages.flatMap((page) =>
            page.messages.map((message) => (
              <MessageView key={message.id} message={message} />
            )),
          )}

          <Paginator paginate={fetchNextPage} hasMoreData={hasNextPage} />

          <div className="h-6" />

        </div>

        {/* Input */}
        <form
          noValidate
          className="fixed bottom-0 left-0 w-full flex justify-center p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) {
              sendMessage(message);
              setMessage("");
            }
          }}
        >
          <div className="flex items-center w-full max-w-3xl gap-2 rounded-full border bg-background px-3 py-2 shadow-sm">

            <Input
              type="text"
              placeholder="Write a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  e.preventDefault();
                  sendMessage(message);
                  setMessage("");
                }
              }}
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