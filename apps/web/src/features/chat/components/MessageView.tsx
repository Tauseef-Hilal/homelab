import { ioSchemas } from "@homelab/contracts/schemas/chat";
import UserAvatar from "./UserAvatar";

interface MessageViewProps {
  messages: ioSchemas.BroadcastMessage[];
}

const MessageView: React.FC<MessageViewProps> = ({ messages }) => {
  const first = messages[0];

  const author = first.author ?? { username: "Unknown" };

  const time = new Date(first.sentAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex gap-3 px-4 py-2 hover:bg-muted/40 transition-colors">
      <div className="shrink-0 mt-1">
        <UserAvatar user={author} />
      </div>

      <div className="flex flex-col leading-snug max-w-[900px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{author.username}</span>

          <span className="text-xs text-muted-foreground">{time}</span>
        </div>

        <div className="flex flex-col gap-[2px]">
          {messages.map((m) => (
            <p
              key={m.id}
              className="text-sm text-muted-foreground whitespace-pre-wrap break-words"
            >
              {m.content}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageView;
