import { ioSchemas } from '@homelab/shared/schemas/chat';

type Message = ioSchemas.BroadcastMessage;

const GROUP_TIME_WINDOW = 5 * 60 * 1000;

export function groupMessages(messages: Message[]): Message[][] {
  const groups: Message[][] = [];

  for (const message of messages) {
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup) {
      groups.push([message]);
      continue;
    }

    const lastMessage = lastGroup[lastGroup.length - 1];

    const sameAuthor = lastMessage.authorId === message.authorId;

    const timeDiff =
      new Date(message.sentAt).getTime() -
      new Date(lastMessage.sentAt).getTime();

    if (sameAuthor && timeDiff < GROUP_TIME_WINDOW) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }
  }

  return groups;
}
