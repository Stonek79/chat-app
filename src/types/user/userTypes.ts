import { User } from '@prisma/client';
export { UserRole } from '@prisma/client';
export type { User } from '@prisma/client';

export type BasicUser = Pick<User, 'id' | 'email' | 'username' | 'avatarUrl' | 'role'>;
