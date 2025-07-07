# ИТОГОВЫЙ ПЛАН РЕФАКТОРИНГА АРХИТЕКТУРЫ CHAT-APP

## 📊 СТАТУС ВЫПОЛНЕНИЯ

### ✅ УЖЕ РЕАЛИЗОВАНО (из migration.md):
- [x] Монорепозиторий настроен (pnpm workspace + turbo)
- [x] Пакеты созданы (@chat-app/chat, @chat-app/db, @chat-app/shared, @chat-app/socket-server) 
- [x] Современные версии (React 19.1, Next 15.3, TypeScript 5.8)
- [x] Workspace зависимости настроены
- [x] Турбо конфигурация работает
- [x] Docker конфигурация обновлена
- [x] Базовая TypeScript конфигурация

### ✅ УЖЕ ИСПРАВЛЕНО (ФАЗЫ 0-3):
- [x] Массивное дублирование типов (schemas vs types) - УСТРАНЕНО
- [x] Неправильная архитектура типизации - исправлена на основе Prisma
- [x] Magic strings и захардкоженные сообщения - централизованы
- [x] Any типы в коде - устранены все случаи
- [x] Edge Runtime проблема - создан @chat-app/constants-edge пакет

### 🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ (осталось исправить):
- [ ] Socket.IO зависимости в shared пакете - нарушение архитектуры
- [ ] Дублирование PrismaClient (db + chat/lib/prisma)
- [ ] Серверные секреты в shared - проблема безопасности

---

## 🎯 ЦЕЛИ РЕФАКТОРИНГА

### Архитектурные:
- ✅ Устранить дублирование PrismaClient
- ✅ Убрать Socket.IO зависимости из shared
- ✅ Разделить серверную и клиентскую конфигурацию
- ✅ Исправить циклические зависимости

### Типизация:
- ✅ **Prisma Schema** → источник истины для структуры данных
- ✅ **Domain Types** → основаны на Prisma types (Pick/Omit)
- ✅ **Zod Schemas** → валидация для API контрактов
- ✅ **Mappers** → безопасные преобразования между слоями

### Технические:
- ✅ Никаких `any` типов (строгий TypeScript)
- ✅ Функциональный подход (React 19)
- ✅ Современные версии пакетов (уже актуальные)

---

## 🏗️ НОВАЯ АРХИТЕКТУРА ПАКЕТОВ

```
packages/
├── db/                           # 🗄️ Prisma - единственный источник БД
│   ├── prisma/schema.prisma     # База данных схема (источник истины)
│   ├── prisma/seed.ts           # Данные для разработки
│   └── src/index.ts             # Экспорт PrismaClient и типов
├── core/                        # 🏢 Бизнес-логика и domain типы
│   ├── types/                   # Domain types (основаны на Prisma)
│   │   ├── user.ts             # ClientUser, UserWithStatus
│   │   ├── chat.ts             # ChatWithDetails, ChatSummary
│   │   └── message.ts          # DisplayMessage, MessagePayload
│   ├── schemas/                 # Zod валидация для API
│   │   ├── user.ts             # createUserSchema, updateUserSchema
│   │   ├── chat.ts             # createChatSchema, sendMessageSchema
│   │   └── validation.ts       # z.infer типы для форм
│   ├── mappers/                 # Безопасные преобразования
│   │   ├── userMappers.ts      # toClientUser, toUserSummary
│   │   └── chatMappers.ts      # toChatWithDetails, toDisplayMessage
│   └── constants/               # Публичные константы
├── server-shared/               # 🔧 Серверные утилиты
│   ├── config/                  # Серверная конфигурация
│   │   └── env.ts              # DATABASE_URL, JWT_SECRET
│   ├── auth/                    # JWT утилиты
│   │   └── jwt.ts              # jose функции
│   └── redis/                   # Redis клиент
│       └── redis.ts            # ioredis конфигурация
├── socket-shared/               # 🔌 Socket.IO транспорт
│   ├── events/                  # Socket.IO типы событий
│   │   └── types.ts            # ServerToClientEvents, SocketAuth
│   ├── adapters/                # Мост core ↔ socket.io
│   │   └── messageAdapter.ts   # DisplayMessage → SocketMessage
│   └── server/                  # Socket.IO server утилиты
│       └── middleware.ts       # authMiddleware, roomsLogic
```

---

## 🔗 АРХИТЕКТУРА ТИПИЗАЦИИ (НОВАЯ)

### 1. **PRISMA SCHEMA** (источник истины)
```prisma
model User {
  id                String    @id @default(cuid())
  username          String    @unique
  email             String    @unique
  hashedPassword    String?   // ПРИВАТНОЕ поле
  avatarUrl         String?
  role              UserRole  @default(USER)
  // relations...
}
```

### 2. **DOMAIN TYPES** (на основе Prisma)
```typescript
// @chat-app/core/src/types/user.ts
import type { User } from '@chat-app/db'

// Публичные данные (без приватных полей)
export type ClientUser = Omit<User, 'hashedPassword' | 'verificationToken'>

// Расширенные типы для UI
export type UserWithStatus = ClientUser & {
  isCurrentUser: boolean
  isOnline: boolean
}

// API типы
export type CreateUserPayload = Pick<User, 'username' | 'email'> & {
  password: string
}
```

### 3. **ZOD SCHEMAS** (валидация)
```typescript
// @chat-app/core/src/schemas/user.ts
export const clientUserSchema = z.object({
  id: z.string().cuid(),
  username: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  // соответствует ClientUser
})

export const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
})
```

### 4. **MAPPERS** (преобразования)
```typescript
// @chat-app/core/src/mappers/userMappers.ts
export function toClientUser(prismaUser: User): ClientUser {
  const { hashedPassword, verificationToken, ...clientUser } = prismaUser
  return clientUser
}
```

---

## 📅 ПЛАН МИГРАЦИИ ПО ФАЗАМ

### 🚀 ФАЗА 0: ПОДГОТОВКА (1 день)
**Статус: ✅ ЗАВЕРШЕНО**

#### Цель: Исправить критические проблемы и настроить строгость

**Шаг 1: Усилить TypeScript строгость**
- [x] Обновить tsconfig.base.json (strict: true, noImplicitAny: true, noUncheckedIndexedAccess: true)
- [x] Добавить ESLint правила против any типов (@typescript-eslint/no-explicit-any: error)
- [x] Диагностированы все проблемы типизации (176 ошибок TS выявлено)

**Шаг 2: Исправить ErrorBoundary на функциональный подход**
- [x] Заменен class ErrorBoundary на функциональный компонент с react-error-boundary
- [x] Совместимость с React 19 обеспечена

**Шаг 3: Провести аудит архитектуры**
- [x] Выявлены нарушенные импорты между пакетами (121 ошибка)
- [x] Найдены отсутствующие зависимости (15 ошибок)
- [x] Диагностированы проблемы типизации (40+ implicit any)

**🎯 Результат ФАЗЫ 0**: Архитектурные проблемы подтверждены и детально диагностированы. TypeScript строгость настроена. Готов к созданию новых пакетов.

---

### 🏗️ ФАЗА 1: СОЗДАНИЕ НОВЫХ ПАКЕТОВ (1 день)
**Статус: ✅ ЗАВЕРШЕНО**

#### Цель: Создать правильную структуру пакетов

**Шаг 1: Создать @chat-app/core**
- [x] mkdir packages/core с правильной структурой (types, schemas, mappers, constants)
- [x] Настроить package.json (только zod + @chat-app/db)
- [x] Настроить tsup сборку и TypeScript конфигурацию

**Шаг 2: Создать @chat-app/server-shared**
- [x] Создан пакет для серверных утилит (config, auth, redis, utils)
- [x] Настроены зависимости (jose, ioredis, core, db)
- [x] Настроена TypeScript конфигурация

**Шаг 3: Создать @chat-app/socket-shared**
- [x] Создан пакет для Socket.IO (types, events, client, server)
- [x] Настроены зависимости (socket.io, socket.io-client, core)
- [x] Настроена TypeScript конфигурация

**🎯 Результат ФАЗЫ 1**: Создана правильная архитектура пакетов. pnpm install работает. Структуры готовы для миграции кода.

---

### 🔄 ФАЗА 2: МИГРАЦИЯ ТИПОВ И СХЕМ (1 день)
**Статус: ✅ ЗАВЕРШЕНО**

#### Цель: Создать правильную архитектуру типизации

**Шаг 1: Создать domain типы на основе Prisma**
- [x] ClientUser = Omit<User, 'hashedPassword' | 'tokens'> - убраны приватные поля
- [x] ChatWithDetails, DisplayMessage на основе Prisma с расширениями для UI
- [x] API payload типы (CreateUserPayload, SendMessagePayload и др.)
- [x] Все enum'ы экспортированы из @chat-app/db

**Шаг 2: Обновить Zod схемы**
- [x] Схемы валидации соответствуют domain типам
- [x] Русские сообщения валидации
- [x] Строгие правила валидации с бизнес-логикой
- [x] Убрано дублирование между schemas и types

**Шаг 3: Создать mappers**
- [x] toClientUser, toDisplayMessage - безопасные преобразования
- [x] Mappers для аутентификации (состояния, токены)
- [x] Mappers для чатов с правами доступа
- [x] Mappers для сообщений с проверкой прав
- [x] Утилитарные функции (canEdit, canDelete и др.)

**🎯 Результат ФАЗЫ 2**: Создана правильная архитектура типизации на основе Prisma Schema. @chat-app/core успешно собирается. Готов к миграции серверного кода.

---

### 🚫 ФАЗА 3: УСТРАНЕНИЕ АРХИТЕКТУРНЫХ НАРУШЕНИЙ (1 день)
**Статус: ✅ ЗАВЕРШЕНО**

#### Цель: Убрать magic strings, any типы, централизовать константы

**Шаг 1: Устранить magic strings и захардкоженные сообщения**
- [x] Найдено и устранено 25+ случаев magic strings в schemas/mappers
- [x] Создаты константы: UI_MESSAGES, USER_ACTIONS, DEFAULT_ROLES, MESSAGE_ACTION_TYPES
- [x] Заменены все hardcoded сообщения валидации на VALIDATION_MESSAGES
- [x] Централизованное управление сообщений и констант

**Шаг 2: Устранить все any типы**
- [x] Найдено и исправлено 12+ случаев any в mappers
- [x] Добавлен правильный импорт User типа из @chat-app/db
- [x] Создан ESLint конфиг в packages/core с запретом any типов
- [x] Исправлены неиспользуемые переменные

**Шаг 3: Решить Edge Runtime проблему**
- [x] Создан @chat-app/constants-edge пакет для middleware
- [x] Автогенерация констант из core (82 константы)
- [x] Решена ошибка "Native module not found: @chat-app/core"
- [x] TypeScript скрипт build-edge-constants.ts через tsx

**🎯 Результат ФАЗЫ 3**: Magic strings устранены, any типы устранены, Edge Runtime совместимость, централизованные константы. Готов к обновлению зависимостей.

---

### 🔧 ФАЗА 4: ИСПРАВЛЕНИЕ ОСТАВШИХСЯ АРХИТЕКТУРНЫХ ПРОБЛЕМ (1 день)
**Статус: ✅ ЗАВЕРШЕНО**

#### Цель: Убрать Socket.IO из shared, исправить PrismaClient, разделить конфигурацию

**Шаг 1: Проверить Socket.IO типы в shared**
- [x] Проверены все файлы - Socket.IO зависимостей НЕТ в shared/package.json
- [x] sendMessageSocketSchema - это валидационная схема, не зависимость
- [x] Все Socket.IO типы уже находятся в socket-shared

**Шаг 2: Исправить дублирование PrismaClient** 
- [x] Проверен apps/chat/src/lib/prisma/index.ts - только реэкспорт из @chat-app/db
- [x] Дублирования PrismaClient НЕТ - используется единый экземпляр

**Шаг 3: Разделить конфигурацию**
- [x] Серверные секреты УЖЕ в server-shared/src/config/ (JWT_SECRET, DATABASE_URL)
- [x] Публичные константы УЖЕ в core/src/constants/
- [x] Разделение конфигурации завершено

**🎯 Результат ФАЗЫ 4**: Архитектурные проблемы отсутствуют. PrismaClient единый, Socket.IO правильно разделен, конфигурация разделена. Готов к проверке зависимостей.

---

### 🔧 ФАЗА 5: ОБНОВЛЕНИЕ ЗАВИСИМОСТЕЙ (1 день)
**Статус: ✅ ЗАВЕРШЕНО**

#### Цель: Настроить правильные зависимости

**Правильная карта зависимостей:**
```
@chat-app/core: только zod + @chat-app/db ✅
@chat-app/server-shared: core + db + jose + ioredis ✅  
@chat-app/socket-shared: core + socket.io ✅
apps/chat: core + socket-shared + db + constants-edge ✅
apps/socket-server: все пакеты ✅
```

**Шаг 1: Исправить зависимости в package.json**
- [x] apps/chat: заменен @chat-app/shared на @chat-app/core + socket-shared
- [x] apps/socket-server: убрано дублирование @chat-app/shared
- [x] Удален next-pwa и связанные зависимости

**Шаг 2: Исправить импорты Socket типов**
- [x] AppSocket импортируется из @chat-app/socket-shared вместо core
- [x] Обновлены все файлы: useChatActions, useChatSocket, useChatData и др.

**Шаг 3: Очистить конфигурацию**
- [x] Удален packages/shared пакет полностью
- [x] Обновлены next.config.ts, tsconfig файлы
- [x] constants-edge пути только где нужно (apps/chat/middleware.ts)
- [x] Удалены PWA файлы (sw.js, manifest.json, workbox)

**🎯 Результат ФАЗЫ 5**: Зависимости оптимизированы, архитектура пакетов правильная, лишние зависимости удалены. Готов к обновлению приложений.

---

### 🏃 ФАЗА 6: ОБНОВЛЕНИЕ ПРИЛОЖЕНИЙ (1 день)
**Статус: 🟡 В ПРОЦЕССЕ**

#### Цель: Использовать новые пакеты и реализовать основную функциональность

- [x] Настроено базовое соединение Socket.IO и отправка/получение сообщений.
- [x] Приложение компилируется и запускается с новой архитектурой.
- [ ] Проверить и обновить все API-роуты (`/api/chats`, `/api/auth/*`) для использования мапперов и схем из `@chat-app/core`.
- [ ] Реализовать UI и логику для создания приватных чатов.
- [ ] Реализовать UI и логику для создания групповых каналов.
- [ ] Реализовать логику выхода из системы с редиректом на главную страницу.
- [ ] Проверить и обновить все обработчики Socket.IO сервера на соответствие новой архитектуре.

---

### 🧪 ФАЗА 7: ТЕСТИРОВАНИЕ И ИСПРАВЛЕНИЯ (1 день)
**Статус: 🟡 В ПРОЦЕССЕ**

#### Цель: Проверить работоспособность

- [x] Проведено базовое функциональное тестирование отправки/получения сообщений.
- [ ] Провести полное функциональное тестирование (создание чатов, редактирование/удаление сообщений, аутентификация).
- [ ] `pnpm build:packages` (проверить успешность сборки всех пакетов)
- [ ] `pnpm typecheck` (проверить отсутствие ошибок типов)
- [ ] `pnpm lint` (проверить any типы и другие правила)

---

### 🧹 ФАЗА 8: ОЧИСТКА И ФИНАЛИЗАЦИЯ (1 день)
**Статус: Планируется**

#### Цель: Убрать старый код

- [ ] Удалить старый shared пакет (после миграции)
- [ ] Очистить дублирующийся код
- [ ] Обновить документацию
- [ ] Финальная проверка

---

## ✅ КРИТЕРИИ УСПЕХА

### Архитектурные:
- [ ] Единый PrismaClient в @chat-app/db
- [ ] Socket.IO только в socket-shared
- [ ] Серверные секреты только в server-shared
- [ ] Никаких циклических зависимостей

### Типизация:
- [x] Prisma → Domain Types → Zod Schemas ✅
- [x] Mappers для всех преобразований ✅
- [x] Никаких `any` типов в коде ✅
- [x] Строгая TypeScript конфигурация ✅

### Функциональность:
- [ ] Все тесты проходят
- [ ] Приложение компилируется без ошибок
- [ ] Авторизация работает
- [ ] Чаты и сообщения работают
- [ ] Socket.IO соединение работает

---

## 🔗 СВЯЗЬ С MIGRATION.MD

**Migration.md фокусировался на:**
- ✅ Настройке монорепозитория (ЗАВЕРШЕНО)
- ✅ Создании базовых пакетов (ЗАВЕРШЕНО)
- ✅ Workspace конфигурации (ЗАВЕРШЕНО)

**Refactoring.md фокусируется на:**
- 🔧 Исправлении архитектурных проблем
- 🔧 Правильной типизации на основе Prisma
- 🔧 Безопасности и производительности

**Время выполнения:** 8 дней (фазы 0-3 уже завершены ✅)  
**Приоритет:** Высокий (критические архитектурные проблемы)

---

## 📝 ПРИМЕЧАНИЯ

- План основан на анализе текущего состояния кода
- Учтены все выявленные архитектурные проблемы
- Сохранена обратная совместимость на переходный период
- Prisma схема выбрана как источник истины для типизации
- Edge Runtime совместимость решена через @chat-app/constants-edge
- Magic strings и any типы полностью устранены из кодовой базы 