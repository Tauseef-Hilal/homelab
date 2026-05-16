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
    <div className="flex gap-4 px-4 py-3 md:px-6 md:py-4 rounded-2xl hover:bg-muted/50 transition-all duration-200 group">
      <div className="shrink-0">
        <UserAvatar user={author} />
      </div>

      <div className="flex flex-col leading-snug min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-sm tracking-tight text-foreground/90">{author.username}</span>
          <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">{time}</span>
        </div>

        <div className="flex flex-col gap-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className="relative group/msg"
            >
              <p className="text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words font-medium">
                {m.content}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity self-start pt-1">
         <button className="p-1.5 rounded-lg hover:bg-background shadow-sm transition-colors text-muted-foreground/40 hover:text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
         </button>
      </div>
    </div>
  );
};

export default MessageView;
