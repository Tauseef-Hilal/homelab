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
        <ForkKnifeCrossedIcon /> <p>Something went wrong</p>
        <Button onClick={() => fetchNextPage()} variant={"outline"}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex flex-col justify-between px-2 h-full">
        <div className="overflow-y-auto flex flex-col-reverse gap-4">
          <div className="p-6"></div>
          {/* New messages */}
          {messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))}

          {/* History */}
          {data?.pages.flatMap((page) =>
            page.messages.map((message) => (
              <MessageView key={message.id} message={message} />
            ))
          )}
          <div className="p-7"></div>
          <Paginator paginate={fetchNextPage} hasMoreData={hasNextPage} />
        </div>
        <form
          noValidate
          className="fixed bottom-0 left-0 w-full flex justify-center gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (message) {
              sendMessage(message);
              setMessage("");
            }
          }}
        >
          <Input
            className="bg-white dark:bg-black"
            type="text"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={(e) => {
              if (e.key == "return" && message) {
                sendMessage(message);
                setMessage("");
              }
            }}
          />
          <Button type="submit" variant={"outline"} className="w-min">
            <SendHorizonalIcon />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
