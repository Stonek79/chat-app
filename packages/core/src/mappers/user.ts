import type { User, UserRole } from '@chat-app/db';
import type { ClientUser } from '../types/user';

/**
 * Преобразует Prisma User в ClientUser (убирает приватные поля)
 */
export function toClientUser(prismaUser: User): ClientUser {
    return {
        id: prismaUser.id,
        username: prismaUser.username,
        email: prismaUser.email,
        avatarUrl: prismaUser.avatarUrl,
        publicKey: prismaUser.publicKey ?? '',
        createdAt: prismaUser.createdAt,
        updatedAt: prismaUser.updatedAt,
        lastSeenAt: prismaUser.lastSeenAt,
        isOnline: prismaUser.isOnline,
        isVerified: prismaUser.isVerified,
        role: prismaUser.role,
    };
}

/**
 * Создает ClientUser из частичных данных (например, из JWT)
 * Заполняет отсутствующие поля безопасными значениями по умолчанию
 */
export function createClientUserFromPartial(partialData: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    isVerified?: boolean;
}): ClientUser {
    const now = new Date();

    return {
        id: partialData.id,
        username: partialData.username,
        email: partialData.email,
        avatarUrl: partialData.avatarUrl ?? null,
        publicKey: '', // Пустая строка для JWT сценариев
        createdAt: partialData.createdAt ?? now,
        updatedAt: partialData.updatedAt ?? now,
        lastSeenAt: null,
        isOnline: false,
        isVerified: partialData.isVerified ?? false,
        role: partialData.role,
    };
}
