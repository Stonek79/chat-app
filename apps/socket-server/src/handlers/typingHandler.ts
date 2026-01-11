import { AppSocketServer, AppSocket } from '@chat-app/socket-shared';
import {
    CLIENT_EVENT_TYPING,
    SERVER_EVENT_TYPING_STARTED,
    SERVER_EVENT_TYPING_STOPPED,
} from '@chat-app/socket-shared';

export const registerTypingHandlers = (io: AppSocketServer, socket: AppSocket) => {
    socket.on(CLIENT_EVENT_TYPING, (payload) => {
        const { chatId, isTyping } = payload;
        const { user } = socket.data;

        if (!user) return;

        const broadcastPayload = {
            chatId,
            userId: user.userId,
            username: user.username,
        };

        const event = isTyping ? SERVER_EVENT_TYPING_STARTED : SERVER_EVENT_TYPING_STOPPED;

        // Broadcast to all users in the chat room except the sender
        socket.to(chatId).emit(event, broadcastPayload);
    });
};
