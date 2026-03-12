import { ioSchemas } from "@homelab/shared/schemas/chat";
import UserAvatar from "./UserAvatar";

interface MessageViewProps {
  message: ioSchemas.BroadcastMessage;
  isOwn?: boolean;
}

const MessageView: React.FC<MessageViewProps> = ({ message, isOwn }) => {
  const time = new Date(message.sentAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex items-start gap-2 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {!isOwn && <UserAvatar user={message.author} />}

      <div className="flex flex-col max-w-[70%]">
        {!isOwn && (
          <span className="text-sm text-muted-foreground mb-1">
            {message.author.username}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2 text-sm shadow-sm break-words ${
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {message.content}
        </div>

        <span
          className={`text-[11px] text-muted-foreground mt-1 ${
            isOwn ? "text-right" : ""
          }`}
        >
          {time}
        </span>
      </div>
    </div>
  );
};

export default MessageView;
