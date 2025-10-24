"use client";

import { useCallback, useEffect, useState } from "react";
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
  const { messages, setMessages, sendMessage } = useMessaging();

  const [message, setMessage] = useState("");
  const [offset, setOffset] = useState<{
    offsetId?: string;
    offsetSentAt?: string;
  }>({});

  const { isPending, data, error, refetch } = useGetBroadcastMessages(
    20,
    offset.offsetSentAt,
    offset.offsetId
  );

  useEffect(() => {
    if (data?.messages) {
      setMessages((prev) => [...prev, ...data.messages]);
    }
  }, [data]);

  const paginate = useCallback(() => {
    setOffset({
      offsetSentAt: messages.at(-1)?.sentAt,
      offsetId: messages.at(-1)?.id,
    });
  }, [messages]);

  if (isPending && messages.length == 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2Icon className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <ForkKnifeCrossedIcon /> <p>Something went wrong</p>
        <Button onClick={() => refetch()} variant={"outline"}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex flex-col justify-between px-2 h-full">
        <div className="overflow-y-auto flex flex-col-reverse gap-4">
          <div className="p-5"></div>
          {messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))}
          <div className="p-5"></div>
          <Paginator
            paginate={paginate}
            hasMoreData={data?.hasMoreData ?? false}
          />
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
            className="bg-white"
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
