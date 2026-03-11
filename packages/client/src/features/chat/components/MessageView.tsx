import { ioSchemas } from "@homelab/shared/schemas/chat";
import UserAvatar from "./UserAvatar";

interface MessageViewProps {
  message: ioSchemas.BroadcastMessage;
}

const MessageView: React.FC<MessageViewProps> = ({ message }) => {
  return (
    <div className="flex gap-2 w-full">
      <UserAvatar user={message.author} />
      <div className="">
        <p className="font-bold text-base/6">{message.author.username}</p>
        <p className="dark:text-neutral-200 text-neutral-600  text-sm/4">
          {message.content}
        </p>
      </div>
    </div>
  );
};

export default MessageView;
