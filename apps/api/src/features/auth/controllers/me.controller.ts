import { catchAsync } from '@server/lib/catchAsync';
import { Request, Response } from 'express';
import { getUserById } from '../services/auth.service';
import { success } from '@server/lib/response';

export const meController = catchAsync(async (req: Request, res: Response) => {
  const user = await getUserById(req.user.id);
  res.status(200).json(success({ user }));
});
