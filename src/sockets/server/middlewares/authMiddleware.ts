import { ExtendedError } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { SocketWithUser } from '../socketHandler'; // Импортируем расширенный тип Socket
import { AUTH_TOKEN_COOKIE_NAME, JWT_SECRET_KEY } from '@/constants';

// Замените на ваш секретный ключ JWT из .env
const JWT_SECRET = process.env.JWT_SECRET || JWT_SECRET_KEY;
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || AUTH_TOKEN_COOKIE_NAME;

interface JwtPayload {
    id: string;
    email: string;
    role: string;
    // Добавьте другие поля, которые есть в вашем JWT payload
}

export const jwtAuthMiddleware = (socket: SocketWithUser, next: (err?: ExtendedError) => void) => {
    console.log('Проверка аутентификации для нового подключения Socket.IO...');
    const handshakeData = socket.handshake;
    const cookies = handshakeData.headers.cookie;

    if (!cookies) {
        console.log('Отсутствуют cookie, отклонение подключения.');
        return next(new Error('Authentication error: No cookies provided.'));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies[AUTH_COOKIE_NAME];

    if (!token) {
        console.log('Отсутствует токен аутентификации в cookie, отклонение подключения.');
        return next(new Error('Authentication error: No auth token found.'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        // Важно: TypeScript может не знать о полях в decoded после простой проверки.
        // Убедитесь, что JwtPayload соответствует структуре вашего токена.
        if (typeof decoded === 'object' && decoded !== null && decoded.id) {
            socket.user = {
                // Прикрепляем данные пользователя к объекту сокета
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            console.log(`Пользователь ${decoded.email} успешно аутентифицирован для Socket.IO.`);
            next();
        } else {
            console.log('Некорректный формат JWT payload после верификации.');
            return next(new Error('Authentication error: Invalid token payload.'));
        }
    } catch (err) {
        console.error('Ошибка верификации JWT:', err);
        return next(new Error('Authentication error: Invalid token.'));
    }
};
