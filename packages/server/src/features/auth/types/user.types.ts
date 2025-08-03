import { UserRole } from '@prisma/client';

export type UserPayload = { id: string; email: string; role: UserRole };
