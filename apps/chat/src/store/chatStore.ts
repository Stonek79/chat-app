// src/store/chatStore.ts
// import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';

// interface Message {
//   id: string;
//   chatId: string;
//   userId: string;
//   content: string; // Расшифрованное содержимое
//   createdAt: string; // или Date
//   // ... другие поля
// }

// interface Chat {
//   id: string;
//   name: string;
//   messages: Message[];
//   encryptionKeyJwk?: JsonWebKey; // Храним JWK ключа шифрования чата
//   // ... другие метаданные чата
// }

// interface ChatState {
//   chats: Record<string, Chat>; // Объекь, где ключ - chatId
//   activeChatId: string | null;
//   // ... другие части состояния, связанные с чатами
// }

// interface ChatActions {
//   addMessage: (chatId: string, message: Message) => void;
//   loadMessages: (chatId: string, messages: Message[]) => void;
//   setActiveChatId: (chatId: string | null) => void;
//   setChatEncryptionKey: (chatId: string, keyJwk: JsonWebKey) => Promise<void>;
//   getChatEncryptionKey: (chatId: string) => Promise<CryptoKey | null>;
//   // ... другие действия
// }

/**
 * Состояние для управления чатами, сообщениями и ключами шифрования (пример с Zustand).
 * Этот store может хранить расшифрованные сообщения на клиенте и ключи шифрования (например, в IndexedDB через persist middleware).
 *
 * Для использования:
 * 1. Установите Zustand: npm install zustand
 * 2. Раскомментируйте и доработайте код ниже.
 */

// const useChatStore = create<ChatState & ChatActions>()(
//   persist(
//     (set, get) => ({
//       chats: {},
//       activeChatId: null,

//       addMessage: (chatId, message) =>
//         set((state) => ({
//           chats: {
//             ...state.chats,
//             [chatId]: {
//               ...state.chats[chatId],
//               messages: [...(state.chats[chatId]?.messages || []), message].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
//             },
//           },
//         })),

//       loadMessages: (chatId, messages) =>
//         set((state) => ({
//           chats: {
//             ...state.chats,
//             [chatId]: {
//               ...state.chats[chatId],
//               name: state.chats[chatId]?.name || 'Чат ' + chatId, // Инициализация имени, если его нет
//               messages: messages.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
//             },
//           },
//         })),

//       setActiveChatId: (chatId) => set({ activeChatId: chatId }),

//       setChatEncryptionKey: async (chatId, keyJwk) => {
//         set((state) => ({
//           chats: {
//             ...state.chats,
//             [chatId]: {
//               ...state.chats[chatId],
//               name: state.chats[chatId]?.name || 'Чат ' + chatId,
//               messages: state.chats[chatId]?.messages || [],
//               encryptionKeyJwk: keyJwk,
//             },
//           },
//         }));
//       },

//       getChatEncryptionKey: async (chatId) => {
//         const chat = get().chats[chatId];
//         if (chat?.encryptionKeyJwk) {
//           try {
//             // Динамический импорт crypto функций, чтобы избежать проблем на сервере, если store используется в SSR
//             const { importKeyFromJwk } = await import('@/lib/crypto');
//             return await importKeyFromJwk(chat.encryptionKeyJwk);
//           } catch (error) {
//             console.error('Ошибка импорта ключа шифрования из JWK:', error);
//             return null;
//           }
//         }
//         return null;
//       },
//     }),
//     {
//       name: 'chat-storage', // Имя для localStorage/IndexedDB
//       storage: createJSONStorage(() => localStorage), // или sessionStorage, или IndexedDB (требует доп. настройки)
      // partialize: (state) => ({ chats: state.chats, activeChatId: state.activeChatId }), // Выбираем, что сохранять
//     }
//   )
// );

// export default useChatStore;

// Заглушка, пока Zustand не установлен и не настроен
const useChatStorePlaceholder = {
  getState: () => ({
    chats: {},
    activeChatId: null,
    addMessage: () => console.warn('useChatStore: addMessage не реализован'),
    loadMessages: () => console.warn('useChatStore: loadMessages не реализован'),
    setActiveChatId: () => console.warn('useChatStore: setActiveChatId не реализован'),
    setChatEncryptionKey: async () => console.warn('useChatStore: setChatEncryptionKey не реализован'),
    getChatEncryptionKey: async () => {
      console.warn('useChatStore: getChatEncryptionKey не реализован');
      return null;
    },
  }),
  subscribe: () => {
    console.warn('useChatStore: subscribe не реализован');
    return () => {};
  },
  // Для прямого использования, как useStore.getState().activeChatId
  chats: {},
  activeChatId: null,
  addMessage: () => console.warn('useChatStore: addMessage не реализован (прямой вызов)'),
  loadMessages: () => console.warn('useChatStore: loadMessages не реализован (прямой вызов)'),
  setActiveChatId: () => console.warn('useChatStore: setActiveChatId не реализован (прямой вызов)'),
  setChatEncryptionKey: async () => console.warn('useChatStore: setChatEncryptionKey не реализован (прямой вызов)'),
  getChatEncryptionKey: async () => {
    console.warn('useChatStore: getChatEncryptionKey не реализован (прямой вызов)');
    return null;
  },
};

export default useChatStorePlaceholder; 