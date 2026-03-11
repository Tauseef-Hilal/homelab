import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { requestSchemas } from '@homelab/shared/schemas/chat';
import { getBroadcastMessages } from '../services/chat.service';
import { success } from '@server/lib/response';

export const getBroadcastMessagesController = catchAsync(
  async (req: Request, res: Response) => {
    const { limit, cursorId, cursorSentAt } =
      requestSchemas.getBroadcastMessagesSchema.parse(req.query);
    const { messages, nextCursor } = await getBroadcastMessages(
      cursorId,
      cursorSentAt,
      limit,
    );
    res.status(200).json(success({ messages, nextCursor }));
  },
);
