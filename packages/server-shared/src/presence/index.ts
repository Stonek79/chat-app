import { getRedisClient } from '../redis';
import { prisma } from '@chat-app/db';

const PRESENCE_KEY_PREFIX = 'user:presence:';

export const PresenceService = {
    /**
     * Marks a user as online in Redis.
     * @param userId The ID of the user.
     */
    async setUserOnline(userId: string): Promise<void> {
        const redis = getRedisClient();
        await redis.set(`${PRESENCE_KEY_PREFIX}${userId}`, 'online');
    },

    /**
     * Marks a user as offline in Redis and updates lastSeenAt in the database.
     * @param userId The ID of the user.
     */
    async setUserOffline(userId: string): Promise<void> {
        const redis = getRedisClient();
        await redis.del(`${PRESENCE_KEY_PREFIX}${userId}`);
        
        // Update lastSeenAt in DB on disconnect
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { lastSeenAt: new Date(), isOnline: false }, // Sync isOnline false for legacy compatibility
            });
        } catch (error) {
            console.error(`Failed to update lastSeenAt for user ${userId}:`, error);
        }
    },

    /**
     * Checks if a user is online.
     * @param userId The ID of the user.
     */
    async isUserOnline(userId: string): Promise<boolean> {
        const redis = getRedisClient();
        const status = await redis.get(`${PRESENCE_KEY_PREFIX}${userId}`);
        return status === 'online';
    },

    /**
     * Checks online status for multiple users.
     * @param userIds Array of user IDs.
     * @returns Map of userId -> isOnline.
     */
    async getOnlineUsers(userIds: string[]): Promise<Record<string, boolean>> {
        if (userIds.length === 0) return {};
        
        const redis = getRedisClient();
        // Use MGET for efficiency
        const keys = userIds.map(id => `${PRESENCE_KEY_PREFIX}${id}`);
        const results = await redis.mget(...keys);
        
        const onlineStatus: Record<string, boolean> = {};
        userIds.forEach((id, index) => {
            onlineStatus[id] = results[index] === 'online';
        });
        
        return onlineStatus;
    }
};
