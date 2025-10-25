import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { getBroadcastMessagesSchema } from '@shared/schemas/chat/request.schema';
import { getBroadcastMessages } from '../services/chat.service';
import { success } from '@server/lib/response';

export const getBroadcastMessagesController = catchAsync(
  async (req: Request, res: Response) => {
    const { limit, cursorId, cursorSentAt } = getBroadcastMessagesSchema.parse(
      req.query
    );
    const { messages, nextCursor } = await getBroadcastMessages(
      cursorId,
      cursorSentAt,
      limit
    );
    res.status(200).json(success({ messages, nextCursor }));
  }
);
