import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketIO } from '@/sockets/server'; // Импорт из нашего главного index.ts в server

// Расширяем типы NextApiResponse для добавления свойства socket.server.io
interface NextApiResponseWithSocket extends NextApiResponse {
    socket: NextApiResponse['socket'] & {
        server: HttpServer & {
            io?: SocketIOServer;
        };
    };
}

export default function socketIOHandler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (req.method === 'GET') {
        // Это основной блок: мы получаем существующий HTTP сервер из res.socket.server
        // и передаем его нашему обработчику Socket.IO
        // Также проверяем, что io еще не инициализирован
        if (res.socket.server.io) {
            console.log('Socket.IO сервер уже запущен на этом HTTP сервере.');
        } else {
            console.log('HTTP сервер найден, Socket.IO еще не запущен, инициализируем...');
            initSocketIO(res.socket.server);
        }
        res.status(200).json({ message: 'Socket.IO handler processed' });
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
