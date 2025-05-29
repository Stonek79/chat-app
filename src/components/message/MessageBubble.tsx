"use client";

import { Message } from "@/types";

        interface MessageBubbleProps {
          message: Message;
        }

/**
 * Компонент для отображения одного сообщения в чате.
 * @param props - Свойства компонента
 * @returns {JSX.Element}
 */
export const MessageBubble = ({ message }: MessageBubbleProps) => {
  // Заглушка. Реализуйте этот компонент на основе вашего дизайна.
  const isMyMessage = message.senderId === 'me';
  return (
    <div style={{
      margin: '5px 0',
      padding: '10px',
      borderRadius: '10px',
      backgroundColor: isMyMessage ? '#DCF8C6' : '#FFFFFF',
      alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
      maxWidth: '70%',
      wordWrap: 'break-word',
      marginLeft: isMyMessage ? 'auto' : '0',
      marginRight: isMyMessage ? '0' : 'auto',
    }}>
      <p>{message.content}</p>
      <small style={{ fontSize: '0.75em', color: '#888', display: 'block', textAlign: isMyMessage ? 'right' : 'left' }}>
        {message.createdAt.toLocaleString()}
      </small>
    </div>
  );
};
