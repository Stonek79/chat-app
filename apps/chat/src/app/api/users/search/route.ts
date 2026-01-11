import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, handleApiError, prisma } from '@/lib';
import { type ClientUser, searchUsersSchema } from '@chat-app/core';
import { PresenceService } from '@chat-app/server-shared';

/**
 * POST /api/users/search
 * Поиск пользователей по имени или email
 */
export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            return NextResponse.json({ message: 'Неавторизован' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const validation = searchUsersSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: 'Ошибка валидации',
                    errors: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { query, limit, excludeUserIds = [] } = validation.data;

        // Формируем список исключаемых ID (текущий пользователь + переданные excludeUserIds)
        const idsToExclude = [currentUser.id, ...excludeUserIds];

        // Поиск пользователей
        const where = query
            ? {
                  AND: [
                      {
                          OR: [
                              { username: { contains: query, mode: 'insensitive' as const } },
                              { email: { contains: query, mode: 'insensitive' as const } },
                          ],
                      },
                      // Исключаем текущего пользователя и переданные ID
                      { id: { notIn: idsToExclude } },
                  ],
              }
            : {
                  // Если запроса нет, возвращаем всех пользователей кроме исключаемых
                  id: { notIn: idsToExclude },
              };

        const users = await prisma.user.findMany({
            where,
            take: limit,
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                publicKey: true,
                createdAt: true,
                updatedAt: true,
                lastSeenAt: true,
                // Still select isOnline from DB to satisfy type check if needed, but we won't use it for logic
                isOnline: true,
                isVerified: true,
                role: true,
            },
            orderBy: [
                { username: 'asc' },
            ],
        });

        // Fetch actual presence from Redis
        const userIds = users.map(u => u.id);
        const onlineStatusMap = await PresenceService.getOnlineUsers(userIds);

        // Преобразуем в ClientUser формат
        const clientUsers: ClientUser[] = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            publicKey: user.publicKey ?? '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastSeenAt: user.lastSeenAt,
            isOnline: onlineStatusMap[user.id] || false,
            isVerified: user.isVerified,
            role: user.role,
        }));

        // Sort by online status in memory
        clientUsers.sort((a, b) => {
            if (a.isOnline === b.isOnline) {
                return a.username.localeCompare(b.username);
            }
            return a.isOnline ? -1 : 1;
        });

        return NextResponse.json({ users: clientUsers }, { status: 200 });
    } catch (error) {
        return handleApiError(error, { message: 'Ошибка при поиске пользователей' });
    }
}
