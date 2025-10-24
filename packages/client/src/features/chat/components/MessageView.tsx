import { BroadcastMessage } from "@shared/schemas/chat/io.schema";
import UserAvatar from "./UserAvatar";

interface MessageViewProps {
  message: BroadcastMessage;
}

const MessageView: React.FC<MessageViewProps> = ({ message }) => {
  return (
    <div className="flex gap-2 items-center">
      <UserAvatar user={message.author} />
      <div>
        <p className="font-bold">{message.author.username}</p>
        <p className="text-neutral-700">{message.content}</p>
      </div>
    </div>
  );
};

export default MessageView;
