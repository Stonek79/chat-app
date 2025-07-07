import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';

export function createSocketRedisAdapter(pubClient: Redis, subClient: Redis) {
    return createAdapter(pubClient, subClient);
}

export { createAdapter };
