import { MessageContentType } from '@chat-app/db';

export const getContentTypeFromFile = (fileType: string): MessageContentType => {
    if (fileType.startsWith('image/')) return MessageContentType.IMAGE;
    if (fileType.startsWith('video/')) return MessageContentType.VIDEO;
    if (fileType.startsWith('audio/')) return MessageContentType.AUDIO;
    return MessageContentType.FILE;
};
