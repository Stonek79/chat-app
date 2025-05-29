// src/utils/validation.ts
// import { z } from 'zod';

/**
 * Модуль для схем валидации данных с использованием Zod.
 * Эти схемы могут использоваться как на клиенте, так и на сервере (в API Routes).
 *
 * Для использования:
 * 1. Установите Zod: npm install zod
 * 2. Раскомментируйте и определите ваши схемы.
 */

// // Схема для регистрации
// export const RegisterSchema = z.object({
//   name: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).max(50).optional(),
//   email: z.string().email({ message: "Некорректный формат email" }),
//   password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
// });
// export type RegisterInput = z.infer<typeof RegisterSchema>;

// // Схема для входа
// export const LoginSchema = z.object({
//   email: z.string().email({ message: "Некорректный формат email" }),
//   password: z.string().min(1, { message: "Пароль не может быть пустым" }), // Минимальная проверка, основная на сервере
// });
// export type LoginInput = z.infer<typeof LoginSchema>;

// // Схема для создания чата
// export const CreateChatSchema = z.object({
//   name: z.string().min(1).max(100).optional(), // Для групповых чатов
//   participantIds: z.array(z.string().cuid({ message: "Некорректный ID участника" })).min(1, { message: "Нужен хотя бы один участник (кроме себя)"}),
//   isGroup: z.boolean(),
// }).refine(data => data.isGroup ? !!data.name : true, {
//   message: "Имя обязательно для группового чата",
//   path: ["name"],
// });
// export type CreateChatInput = z.infer<typeof CreateChatSchema>;

// // Схема для отправки сообщения (базовая, без шифрования)
// export const SendMessageSchema = z.object({
//   chatId: z.string().cuid({ message: "Некорректный ID чата" }),
//   textContent: z.string().min(1, { message: "Сообщение не может быть пустым" }).max(5000),
//   // Дополнительные поля, если нужны, например, для ответов или вложений
// });
// export type SendMessageInput = z.infer<typeof SendMessageSchema>;


// Заглушка, пока Zod не установлен и схемы не определены.
export const placeholderValidation = () => {
  console.warn('Модуль src/utils/validation.ts: Zod схемы не определены.');
  return true;
}; 